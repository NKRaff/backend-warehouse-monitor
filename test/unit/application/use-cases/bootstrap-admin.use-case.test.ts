import { BootstrapAdminUseCase } from "@application/use-cases/bootstrap-admin.use-case.js";
import { ConflictError } from "@shared/errors/conflict-error.js";
import { UnprocessableEntityError } from "@shared/errors/unprocessable-entity-error.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { makeUser } from "../../../helpers/factories.js";
import {
	createAlertRepoMock,
	createAuditLogRepoMock,
	createNotificationRepoMock,
	createNotificationServiceMock,
	createPasswordHasherMock,
	createUserRepoMock,
	createUuidProviderMock,
} from "../../../helpers/mocks.js";
import { resetSingleton } from "../../../helpers/singleton.js";

function setup() {
	resetSingleton(BootstrapAdminUseCase);

	const uuidProvider = createUuidProviderMock();
	const passwordHasher = createPasswordHasherMock();
	const userRepo = createUserRepoMock();
	const alertRepo = createAlertRepoMock();
	const notificationRepo = createNotificationRepoMock();
	const auditLogRepo = createAuditLogRepoMock();
	const { service, notify } = createNotificationServiceMock();

	// Por padrão ainda não existe nenhum administrador.
	userRepo.findByRole.mockResolvedValue([]);

	const useCase = BootstrapAdminUseCase.instance(
		uuidProvider,
		passwordHasher,
		userRepo,
		alertRepo,
		notificationRepo,
		auditLogRepo,
		service,
	);

	return {
		useCase,
		passwordHasher,
		userRepo,
		alertRepo,
		notificationRepo,
		auditLogRepo,
		notify,
	};
}

// O use case altera `input.email`; por isso cada teste recebe um objeto novo.
const validInput = () => ({
	name: "Administrador Inicial",
	email: "admin@empresa.com",
});

describe("BootstrapAdminUseCase — primeiro administrador do sistema", () => {
	beforeEach(() => {
		vi.spyOn(console, "error").mockImplementation(() => {});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("quando ainda não existe administrador", () => {
		it("consulta administradores existentes antes de criar", async () => {
			const { useCase, userRepo } = setup();

			await useCase.execute(validInput());

			expect(userRepo.findByRole).toHaveBeenCalledWith("administrator");
		});

		it("cria o administrador com e-mail e nome normalizados, exigindo a troca da senha temporária", async () => {
			const { useCase, userRepo, passwordHasher } = setup();

			await useCase.execute({
				name: "  Administrador Inicial ",
				email: "  ADMIN@Empresa.com ",
			});

			const savedUser = userRepo.save.mock.calls[0]?.[0];
			const temporaryPassword = passwordHasher.hash.mock.calls[0]?.[0];
			expect(userRepo.save).toHaveBeenCalledTimes(1);
			expect(userRepo.findByEmail).toHaveBeenCalledWith("admin@empresa.com");
			expect(savedUser?.role).toBe("administrator");
			expect(savedUser?.name).toBe("Administrador Inicial");
			expect(savedUser?.email.value).toBe("admin@empresa.com");
			expect(savedUser?.isDefaultPassword).toBe(true);
			expect(savedUser?.passwordHasher).toBe(`hashed:${temporaryPassword}`);
		});

		it("gera uma senha temporária digitável (ASCII imprimível, sem espaços)", async () => {
			const { useCase, passwordHasher } = setup();

			await useCase.execute(validInput());

			expect(passwordHasher.hash.mock.calls[0]?.[0]).toMatch(
				/^[\x21-\x7e]{8,}$/,
			);
		});

		it("registra alerta e notificação de e-mail vinculados ao administrador", async () => {
			const { useCase, userRepo, alertRepo, notificationRepo } = setup();

			await useCase.execute(validInput());

			const savedUser = userRepo.save.mock.calls[0]?.[0];
			const alert = alertRepo.save.mock.calls[0]?.[0];
			const notification = notificationRepo.save.mock.calls[0]?.[0];
			expect(alert?.type).toBe("register_user");
			expect(alert?.severity).toBe("info");
			expect(notification?.alertId).toBe(alert?.id);
			expect(notification?.recipientId).toBe(savedUser?.id);
			expect(notification?.channels).toEqual(["email"]);
		});

		it("envia a senha temporária por e-mail ao administrador", async () => {
			const { useCase, userRepo, notify } = setup();

			await useCase.execute(validInput());

			const savedUser = userRepo.save.mock.calls[0]?.[0];
			const message = notify.mock.calls[0]?.[0];
			expect(notify).toHaveBeenCalledTimes(1);
			expect(message?.recipient).toBe(savedUser);
			expect(message?.channels).toEqual(["email"]);
			expect(message?.type).toBe("register_user");
		});

		it("audita a criação com o 'system' como ator (não há usuário logado)", async () => {
			const { useCase, userRepo, auditLogRepo } = setup();

			await useCase.execute(validInput());

			const savedUser = userRepo.save.mock.calls[0]?.[0];
			const log = auditLogRepo.save.mock.calls[0]?.[0];
			expect(log?.actorId).toBe("system");
			expect(log?.action).toBe("create");
			expect(log?.resourceType).toBe("user");
			expect(log?.resourceId).toBe(savedUser?.id);
		});

		it("resolve sem valor (void)", async () => {
			const { useCase } = setup();

			await expect(useCase.execute(validInput())).resolves.toBeUndefined();
		});

		it("falha no envio do e-mail não desfaz a criação e é registrada em log", async () => {
			const { useCase, notify, auditLogRepo } = setup();
			notify.mockRejectedValueOnce(new Error("SMTP indisponível"));

			await expect(useCase.execute(validInput())).resolves.toBeUndefined();

			await vi.waitFor(() => expect(console.error).toHaveBeenCalledTimes(1));
			expect(auditLogRepo.save).toHaveBeenCalledTimes(1);
		});
	});

	describe("quando já existe administrador", () => {
		it("não faz nada (idempotente a cada inicialização)", async () => {
			const { useCase, userRepo, passwordHasher, alertRepo, notificationRepo, auditLogRepo, notify } = setup();
			userRepo.findByRole.mockResolvedValue([makeUser({ role: "administrator" })]);

			await expect(useCase.execute(validInput())).resolves.toBeUndefined();

			expect(userRepo.findByEmail).not.toHaveBeenCalled();
			expect(passwordHasher.hash).not.toHaveBeenCalled();
			expect(userRepo.save).not.toHaveBeenCalled();
			expect(alertRepo.save).not.toHaveBeenCalled();
			expect(notificationRepo.save).not.toHaveBeenCalled();
			expect(auditLogRepo.save).not.toHaveBeenCalled();
			expect(notify).not.toHaveBeenCalled();
		});

		it("uma segunda execução, depois da primeira, não cria outro administrador", async () => {
			const { useCase, userRepo, notify } = setup();
			await useCase.execute(validInput());
			const created = userRepo.save.mock.calls[0]?.[0];
			userRepo.findByRole.mockResolvedValue(created ? [created] : []);

			await useCase.execute(validInput());

			expect(userRepo.save).toHaveBeenCalledTimes(1);
			expect(notify).toHaveBeenCalledTimes(1);
		});
	});

	describe("erros", () => {
		it("rejeita quando o e-mail já pertence a um usuário que não é administrador", async () => {
			const { useCase, userRepo, passwordHasher, notify } = setup();
			userRepo.findByEmail.mockResolvedValue(
				makeUser({ email: "admin@empresa.com", role: "operator" }),
			);

			await expect(useCase.execute(validInput())).rejects.toThrow(ConflictError);
			await expect(useCase.execute(validInput())).rejects.toThrow(
				"Email já cadastrado",
			);

			expect(passwordHasher.hash).not.toHaveBeenCalled();
			expect(userRepo.save).not.toHaveBeenCalled();
			expect(notify).not.toHaveBeenCalled();
		});

		it.each([
			["e-mail inválido", { name: "Administrador Inicial", email: "xyz" }],
			["nome curto", { name: "Ad", email: "admin@empresa.com" }],
			["nome com HTML", { name: "<script>x</script>", email: "admin@empresa.com" }],
		])("rejeita %s sem salvar nada", async (_motivo, input) => {
			const { useCase, userRepo, notify } = setup();

			await expect(useCase.execute(input)).rejects.toThrow(
				UnprocessableEntityError,
			);

			expect(userRepo.save).not.toHaveBeenCalled();
			expect(notify).not.toHaveBeenCalled();
		});

		it("propaga falha ao consultar administradores existentes", async () => {
			const { useCase, userRepo } = setup();
			userRepo.findByRole.mockRejectedValue(new Error("MongoDB fora do ar"));

			await expect(useCase.execute(validInput())).rejects.toThrow(
				"MongoDB fora do ar",
			);
			expect(userRepo.save).not.toHaveBeenCalled();
		});
	});

	it("é um Singleton", () => {
		const { useCase } = setup();
		const { service } = createNotificationServiceMock();

		const again = BootstrapAdminUseCase.instance(
			createUuidProviderMock(),
			createPasswordHasherMock(),
			createUserRepoMock(),
			createAlertRepoMock(),
			createNotificationRepoMock(),
			createAuditLogRepoMock(),
			service,
		);

		expect(again).toBe(useCase);
	});
});
