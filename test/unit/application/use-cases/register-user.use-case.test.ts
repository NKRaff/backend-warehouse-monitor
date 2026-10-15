import { RegisterUserUseCase } from "@application/use-cases/register-user.use-case.js";
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
	resetSingleton(RegisterUserUseCase);

	const uuidProvider = createUuidProviderMock();
	const passwordHasher = createPasswordHasherMock();
	const userRepo = createUserRepoMock();
	const alertRepo = createAlertRepoMock();
	const notificationRepo = createNotificationRepoMock();
	const auditLogRepo = createAuditLogRepoMock();
	const { service, notify } = createNotificationServiceMock();

	const useCase = RegisterUserUseCase.instance(
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
	actorId: "admin-1",
	name: "João Souza",
	email: "joao@empresa.com",
	role: "operator" as const,
});

describe("RegisterUserUseCase — RF-BE-002 / RF-BE-003", () => {
	beforeEach(() => {
		vi.spyOn(console, "error").mockImplementation(() => {});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("caminho feliz", () => {
		it("cadastra o usuário normalizando nome e e-mail", async () => {
			const { useCase, userRepo } = setup();

			const result = await useCase.execute({
				...validInput(),
				name: "  João Souza ",
				email: "  JOAO@Empresa.com ",
			});

			const savedUser = userRepo.save.mock.calls[0]?.[0];
			expect(userRepo.findByEmail).toHaveBeenCalledWith("joao@empresa.com");
			expect(userRepo.save).toHaveBeenCalledTimes(1);
			expect(savedUser?.name).toBe("João Souza");
			expect(savedUser?.email.value).toBe("joao@empresa.com");
			expect(savedUser?.role).toBe("operator");
			expect(result).toEqual({
				message: "Usuario cadastrado com sucesso",
				user: {
					id: savedUser?.id,
					name: "João Souza",
					email: { value: "joao@empresa.com", isVerified: false },
					role: "operator",
				},
			});
		});

		it("guarda apenas o hash da senha temporária e exige a troca no primeiro acesso", async () => {
			const { useCase, userRepo, passwordHasher } = setup();

			await useCase.execute(validInput());

			const temporaryPassword = passwordHasher.hash.mock.calls[0]?.[0];
			const savedUser = userRepo.save.mock.calls[0]?.[0];
			expect(passwordHasher.hash).toHaveBeenCalledTimes(1);
			expect(temporaryPassword).toMatch(/^[\x21-\x7e]{8,}$/);
			expect(savedUser?.passwordHasher).toBe(`hashed:${temporaryPassword}`);
			expect(savedUser?.passwordHasher).not.toBe(temporaryPassword);
			expect(savedUser?.isDefaultPassword).toBe(true);
		});

		it("gera senhas temporárias digitáveis (ASCII imprimível, sem espaços) e diferentes a cada cadastro", async () => {
			const { useCase, passwordHasher } = setup();

			await useCase.execute(validInput());
			await useCase.execute({ ...validInput(), email: "outro@empresa.com" });

			const [first, second] = passwordHasher.hash.mock.calls.map(([pw]) => pw);
			expect(first).toMatch(/^[\x21-\x7e]{8,}$/);
			expect(second).toMatch(/^[\x21-\x7e]{8,}$/);
			expect(first).not.toBe(second);
		});

		it("registra alerta e notificação por e-mail vinculados ao novo usuário", async () => {
			const { useCase, userRepo, alertRepo, notificationRepo } = setup();

			await useCase.execute(validInput());

			const savedUser = userRepo.save.mock.calls[0]?.[0];
			const alert = alertRepo.save.mock.calls[0]?.[0];
			const notification = notificationRepo.save.mock.calls[0]?.[0];
			expect(alert?.type).toBe("register_user");
			expect(alert?.severity).toBe("info");
			expect(alert?.status).toBe("active");
			expect(alert?.title).toBe("Acesso ao sistema disponibilizado");
			expect(notification?.alertId).toBe(alert?.id);
			expect(notification?.recipientId).toBe(savedUser?.id);
			expect(notification?.channels).toEqual(["email"]);
		});

		it("dispara a notificação por e-mail para o novo usuário", async () => {
			const { useCase, userRepo, alertRepo, notify } = setup();

			await useCase.execute(validInput());

			const savedUser = userRepo.save.mock.calls[0]?.[0];
			const alert = alertRepo.save.mock.calls[0]?.[0];
			const message = notify.mock.calls[0]?.[0];
			expect(notify).toHaveBeenCalledTimes(1);
			expect(message?.recipient).toBe(savedUser);
			expect(message?.channels).toEqual(["email"]);
			expect(message?.type).toBe("register_user");
			expect(message?.severity).toBe("info");
			expect(message?.status).toBe("active");
			expect(message?.title).toBe(alert?.title);
			expect(message?.message).toBe(alert?.description);
		});

		it("audita a criação com o administrador como ator (RF-BE-031)", async () => {
			const { useCase, userRepo, auditLogRepo } = setup();

			await useCase.execute(validInput());

			const savedUser = userRepo.save.mock.calls[0]?.[0];
			const log = auditLogRepo.save.mock.calls[0]?.[0];
			expect(auditLogRepo.save).toHaveBeenCalledTimes(1);
			expect(log?.actorId).toBe("admin-1");
			expect(log?.action).toBe("create");
			expect(log?.resourceType).toBe("user");
			expect(log?.resourceId).toBe(savedUser?.id);
		});
	});

	describe("falhas de e-mail (RF-BE-002: falha no envio não desfaz o cadastro)", () => {
		it("conclui o cadastro e registra o erro quando o envio do e-mail falha", async () => {
			const { useCase, notify, auditLogRepo } = setup();
			notify.mockRejectedValueOnce(new Error("SMTP indisponível"));

			const result = await useCase.execute(validInput());

			expect(result.message).toBe("Usuario cadastrado com sucesso");
			await vi.waitFor(() => expect(console.error).toHaveBeenCalledTimes(1));
			expect(console.error).toHaveBeenCalledWith(
				expect.stringContaining("Falha no envio de e-mail"),
				expect.objectContaining({ error: "SMTP indisponível" }),
			);
			expect(auditLogRepo.save).toHaveBeenCalledTimes(1);
		});

		it("não espera o envio do e-mail terminar para responder", async () => {
			const { useCase, notify } = setup();
			notify.mockReturnValueOnce(new Promise<void>(() => {}));

			await expect(useCase.execute(validInput())).resolves.toMatchObject({
				message: "Usuario cadastrado com sucesso",
			});
		});
	});

	describe("erros", () => {
		it("rejeita e-mail já cadastrado sem criar nada", async () => {
			const { useCase, userRepo, passwordHasher, alertRepo, notificationRepo, auditLogRepo, notify } = setup();
			userRepo.findByEmail.mockResolvedValue(
				makeUser({ email: "joao@empresa.com" }),
			);

			await expect(useCase.execute(validInput())).rejects.toThrow(ConflictError);
			await expect(useCase.execute(validInput())).rejects.toThrow(
				"Email já cadastrado",
			);

			expect(passwordHasher.hash).not.toHaveBeenCalled();
			expect(userRepo.save).not.toHaveBeenCalled();
			expect(alertRepo.save).not.toHaveBeenCalled();
			expect(notificationRepo.save).not.toHaveBeenCalled();
			expect(auditLogRepo.save).not.toHaveBeenCalled();
			expect(notify).not.toHaveBeenCalled();
		});

		it("considera e-mails iguais mesmo com caixa/espaços diferentes", async () => {
			const { useCase, userRepo } = setup();
			userRepo.findByEmail.mockImplementation(async (email) =>
				email === "joao@empresa.com" ? makeUser({ email }) : null,
			);

			await expect(
				useCase.execute({ ...validInput(), email: " JOAO@EMPRESA.COM " }),
			).rejects.toThrow(ConflictError);
		});

		it("rejeita e-mail com formato inválido", async () => {
			const { useCase, userRepo, notify } = setup();

			await expect(
				useCase.execute({ ...validInput(), email: "email-invalido" }),
			).rejects.toThrow(UnprocessableEntityError);

			expect(userRepo.save).not.toHaveBeenCalled();
			expect(notify).not.toHaveBeenCalled();
		});

		it("rejeita nome com menos de 4 caracteres", async () => {
			const { useCase, userRepo, notify } = setup();

			await expect(
				useCase.execute({ ...validInput(), name: "Jo" }),
			).rejects.toThrow(/Nome do usuario/);

			expect(userRepo.save).not.toHaveBeenCalled();
			expect(notify).not.toHaveBeenCalled();
		});

		it("rejeita nome com HTML/caracteres especiais (evita injeção de HTML nos e-mails)", async () => {
			const { useCase, userRepo, notify } = setup();

			await expect(
				useCase.execute({ ...validInput(), name: "<script>alert(1)</script>" }),
			).rejects.toThrow(/caracteres especiais/);

			expect(userRepo.save).not.toHaveBeenCalled();
			expect(notify).not.toHaveBeenCalled();
		});

		it("propaga falha de persistência sem enviar e-mail", async () => {
			const { useCase, userRepo, notify } = setup();
			userRepo.save.mockRejectedValue(new Error("MongoDB fora do ar"));

			await expect(useCase.execute(validInput())).rejects.toThrow(
				"MongoDB fora do ar",
			);

			expect(notify).not.toHaveBeenCalled();
		});
	});

	it("é um Singleton", () => {
		const { useCase } = setup();
		const { service } = createNotificationServiceMock();

		const again = RegisterUserUseCase.instance(
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
