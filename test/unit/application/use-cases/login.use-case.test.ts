import { LoginUseCase } from "@application/use-cases/login.use-case.js";
import { ForbiddenError } from "@shared/errors/forbidden-error.js";
import { UnprocessableEntityError } from "@shared/errors/unprocessable-entity-error.js";
import { describe, expect, it } from "vitest";
import { makeUser } from "../../../helpers/factories.js";
import {
	createAuditLogRepoMock,
	createPasswordHasherMock,
	createTokenProviderMock,
	createTokenRepoMock,
	createUserRepoMock,
	createUuidProviderMock,
} from "../../../helpers/mocks.js";
import { resetSingleton } from "../../../helpers/singleton.js";

function setup() {
	resetSingleton(LoginUseCase);

	const passwordHasher = createPasswordHasherMock();
	const tokenProvider = createTokenProviderMock();
	const uuidProvider = createUuidProviderMock();
	const userRepo = createUserRepoMock();
	const auditLogRepo = createAuditLogRepoMock();
	const tokenRepo = createTokenRepoMock();

	const useCase = LoginUseCase.instance(
		passwordHasher,
		tokenProvider,
		uuidProvider,
		userRepo,
		auditLogRepo,
		tokenRepo,
	);

	return { useCase, passwordHasher, tokenProvider, userRepo, auditLogRepo, tokenRepo };
}

describe("LoginUseCase — RF-BE-001", () => {
	describe("credenciais válidas", () => {
		it("autentica, devolve tokens e dados públicos sem expor o hash", async () => {
			const { useCase, userRepo, passwordHasher, tokenProvider, tokenRepo } = setup();
			const user = makeUser({
				id: "user-7",
				role: "manager",
			});
			userRepo.findByEmail.mockResolvedValue(user);

			const result = await useCase.execute({
				email: "maria@empresa.com",
				password: "Senha@123",
			});

			expect(passwordHasher.compare).toHaveBeenCalledWith(
				"Senha@123",
				user.passwordHasher,
			);
			expect(tokenProvider.sign).toHaveBeenCalledWith({ sub: "user-7" });
			expect(result).toEqual({
				message: "Usuario autenticado com sucesso",
				user: {
					id: "user-7",
					name: "Maria Silva",
					email: { value: "maria@empresa.com", isVerified: false },
					role: "manager",
				},
				accessToken: "token-for-user-7",
				refreshToken: expect.any(String),
			});
			const savedToken = tokenRepo.save.mock.calls[0]?.[0];
			expect(savedToken?.type).toBe("refresh");
			expect(savedToken?.value).not.toBe(result.refreshToken);
			expect(savedToken?.verify(result.refreshToken)).toBe(true);
		});

		it("não inclui estado de troca de senha ausente no contrato atual", async () => {
			const { useCase, userRepo } = setup();
			userRepo.findByEmail.mockResolvedValue(makeUser());

			const result = await useCase.execute({
				email: "maria@empresa.com",
				password: "Senha@123",
			});

			expect(result).not.toHaveProperty("requiresPasswordChange");
		});

		it("normaliza o e-mail (trim + minúsculas) antes de buscar", async () => {
			const { useCase, userRepo } = setup();
			userRepo.findByEmail.mockResolvedValue(makeUser());

			await useCase.execute({
				email: "  Maria@Empresa.COM ",
				password: "Senha@123",
			});

			expect(userRepo.findByEmail).toHaveBeenCalledWith("maria@empresa.com");
		});

		it("não vaza o hash da senha na resposta", async () => {
			const { useCase, userRepo } = setup();
			const user = makeUser();
			userRepo.findByEmail.mockResolvedValue(user);

			const result = await useCase.execute({
				email: "maria@empresa.com",
				password: "Senha@123",
			});

			expect(JSON.stringify(result)).not.toContain(user.passwordHasher);
		});

		it("audita o login (RF-BE-031)", async () => {
			const { useCase, userRepo, auditLogRepo } = setup();
			userRepo.findByEmail.mockResolvedValue(makeUser({ id: "user-7" }));

			await useCase.execute({
				email: "maria@empresa.com",
				password: "Senha@123",
			});

			const log = auditLogRepo.save.mock.calls[0]?.[0];
			expect(auditLogRepo.save).toHaveBeenCalledTimes(1);
			expect(log?.actorId).toBe("user-7");
			expect(log?.action).toBe("login");
			expect(log?.resourceId).toBe("user-7");
			expect(log?.resourceType).toBe("user");
		});
	});

	describe("credenciais inválidas", () => {
		it("rejeita e-mail inexistente", async () => {
			const { useCase, userRepo, tokenProvider, auditLogRepo } = setup();
			userRepo.findByEmail.mockResolvedValue(null);

			await expect(
				useCase.execute({ email: "x@empresa.com", password: "Senha@123" }),
			).rejects.toThrow(UnprocessableEntityError);
			await expect(
				useCase.execute({ email: "x@empresa.com", password: "Senha@123" }),
			).rejects.toThrow("Credenciais invalidas");

			expect(tokenProvider.sign).not.toHaveBeenCalled();
			expect(auditLogRepo.save).not.toHaveBeenCalled();
		});

		it("rejeita senha incorreta com a mesma mensagem (não revela se o e-mail existe)", async () => {
			const { useCase, userRepo, tokenProvider, auditLogRepo } = setup();
			userRepo.findByEmail.mockResolvedValue(makeUser());

			await expect(
				useCase.execute({ email: "maria@empresa.com", password: "Errada@1" }),
			).rejects.toThrow(UnprocessableEntityError);
			await expect(
				useCase.execute({ email: "maria@empresa.com", password: "Errada@1" }),
			).rejects.toThrow("Credenciais invalidas");

			expect(tokenProvider.sign).not.toHaveBeenCalled();
			expect(auditLogRepo.save).not.toHaveBeenCalled();
		});

		it("rejeita usuário removido (soft delete) sem verificar a senha", async () => {
			const { useCase, userRepo, passwordHasher, tokenProvider } = setup();
			userRepo.findByEmail.mockResolvedValue(
				makeUser({ deletedAt: new Date() }),
			);

			await expect(
				useCase.execute({ email: "maria@empresa.com", password: "Senha@123" }),
			).rejects.toThrow(ForbiddenError);

			expect(passwordHasher.compare).not.toHaveBeenCalled();
			expect(tokenProvider.sign).not.toHaveBeenCalled();
		});
	});

	it("é um Singleton", () => {
		const { useCase } = setup();

		const again = LoginUseCase.instance(
			createPasswordHasherMock(),
			createTokenProviderMock(),
			createUuidProviderMock(),
			createUserRepoMock(),
			createAuditLogRepoMock(),
			createTokenRepoMock(),
		);

		expect(again).toBe(useCase);
	});
});
