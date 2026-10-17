import { PasswordPolicyService } from "@application/services/password-policy.service.js";
import { ChangePasswordUseCase } from "@application/use-cases/change-password.use-case.js";
import { Token } from "@domain/entities/token.js";
import { NotFoundError } from "@shared/errors/not-found-error.js";
import { UnauthorizedError } from "@shared/errors/unauthorized-error.js";
import { UnprocessableEntityError } from "@shared/errors/unprocessable-entity-error.js";
import { describe, expect, it, vi } from "vitest";
import { makeUser } from "../../../helpers/factories.js";
import {
	createAuditLogRepoMock,
	createPasswordHasherMock,
	createTokenRepoMock,
	createUserRepoMock,
	createUuidProviderMock,
} from "../../../helpers/mocks.js";
import { resetSingleton } from "../../../helpers/singleton.js";

const RESET_TOKEN = "reset-token-plain";

function makeStoredToken(value = RESET_TOKEN, expiresAt = new Date(Date.now() + 60_000)) {
	const token = Token.createPasswordReset("reset-1", "user-1");
	token.value = value;
	const valueHash = token.hash();
	return Token.restore({
		id: token.id,
		userId: token.userId,
		type: "password_reset",
		value: valueHash,
		expiresAt,
	});
}

function setup(policy?: PasswordPolicyService) {
	resetSingleton(ChangePasswordUseCase);
	const passwordHasher = createPasswordHasherMock();
	const uuidProvider = createUuidProviderMock();
	const userRepo = createUserRepoMock();
	const auditLogRepo = createAuditLogRepoMock();
	const tokenRepo = createTokenRepoMock();
	const policyStub = {
		isValid: vi.fn<PasswordPolicyService["isValid"]>().mockReturnValue(true),
	};
	tokenRepo.findByValue.mockResolvedValue(makeStoredToken());
	const useCase = ChangePasswordUseCase.instance(
		passwordHasher,
		uuidProvider,
		userRepo,
		auditLogRepo,
		tokenRepo,
		policy ?? (policyStub as unknown as PasswordPolicyService),
	);
	return {
		useCase,
		passwordHasher,
		userRepo,
		auditLogRepo,
		tokenRepo,
		policyStub,
	};
}

const input = () => ({
	resetToken: RESET_TOKEN,
	password: "NovaSenha@456",
	confirmPassword: "NovaSenha@456",
});

describe("ChangePasswordUseCase — RF-BE-005", () => {
	it("valida o token, atualiza o hash, invalida o token e audita a redefinição", async () => {
		const { useCase, policyStub, passwordHasher, userRepo, tokenRepo, auditLogRepo } =
			setup();
		userRepo.findById.mockResolvedValue(makeUser({ id: "user-1" }));

		const result = await useCase.execute(input());

		expect(tokenRepo.findByValue).toHaveBeenCalledWith(RESET_TOKEN);
		expect(policyStub.isValid).toHaveBeenCalledWith(
			"NovaSenha@456",
			"NovaSenha@456",
		);
		expect(passwordHasher.hash).toHaveBeenCalledWith("NovaSenha@456");
		expect(userRepo.updatePassword).toHaveBeenCalledExactlyOnceWith(
			"user-1",
			"hashed:NovaSenha@456",
		);
		expect(tokenRepo.deleteById).toHaveBeenCalledExactlyOnceWith("reset-1");
		expect(auditLogRepo.save.mock.calls[0]?.[0]).toMatchObject({
			actorId: "user-1",
			action: "change_password",
			resourceId: "user-1",
			resourceType: "user",
		});
		expect(result).toEqual({ message: "Nova senha definida com sucesso" });
	});

	it("rejeita token que não existe sem alterar senha nem auditar", async () => {
		const { useCase, userRepo, tokenRepo, auditLogRepo } = setup();
		tokenRepo.findByValue.mockResolvedValue(null);

		await expect(useCase.execute(input())).rejects.toThrow(NotFoundError);
		expect(userRepo.findById).not.toHaveBeenCalled();
		expect(userRepo.updatePassword).not.toHaveBeenCalled();
		expect(tokenRepo.deleteById).not.toHaveBeenCalled();
		expect(auditLogRepo.save).not.toHaveBeenCalled();
	});

	it("rejeita token inválido sem alterar senha", async () => {
		const { useCase, userRepo, tokenRepo } = setup();
		tokenRepo.findByValue.mockResolvedValue(makeStoredToken("outro-token"));

		await expect(useCase.execute(input())).rejects.toThrow(UnauthorizedError);
		expect(userRepo.findById).not.toHaveBeenCalled();
		expect(userRepo.updatePassword).not.toHaveBeenCalled();
	});

	it("rejeita token expirado sem alterar senha", async () => {
		const { useCase, userRepo, tokenRepo } = setup();
		tokenRepo.findByValue.mockResolvedValue(
			makeStoredToken(RESET_TOKEN, new Date(Date.now() - 1)),
		);

		await expect(useCase.execute(input())).rejects.toThrow(/expirou/);
		expect(userRepo.findById).not.toHaveBeenCalled();
		expect(userRepo.updatePassword).not.toHaveBeenCalled();
	});

	it("rejeita usuário ausente e mantém o token disponível", async () => {
		const { useCase, userRepo, tokenRepo, auditLogRepo } = setup();
		userRepo.findById.mockResolvedValue(null);

		await expect(useCase.execute(input())).rejects.toThrow("Usuario não encontrado");
		expect(tokenRepo.deleteById).not.toHaveBeenCalled();
		expect(auditLogRepo.save).not.toHaveBeenCalled();
	});

	it("não apaga o token quando a política de senha reprova a nova senha", async () => {
		const { useCase, policyStub, passwordHasher, userRepo, tokenRepo, auditLogRepo } =
			setup();
		policyStub.isValid.mockImplementation(() => {
			throw new UnprocessableEntityError("Senha invalida: muito curta");
		});

		await expect(useCase.execute(input())).rejects.toThrow("Senha invalida: muito curta");
		expect(passwordHasher.hash).not.toHaveBeenCalled();
		expect(userRepo.updatePassword).not.toHaveBeenCalled();
		expect(tokenRepo.deleteById).not.toHaveBeenCalled();
		expect(auditLogRepo.save).not.toHaveBeenCalled();
	});

	it("rejeita senha fraca usando a política real", async () => {
		resetSingleton(PasswordPolicyService);
		const { useCase, userRepo } = setup(PasswordPolicyService.instance());

		await expect(
			useCase.execute({ ...input(), password: "123", confirmPassword: "123" }),
		).rejects.toThrow(/Senha invalida/);
		expect(userRepo.updatePassword).not.toHaveBeenCalled();
	});

	it("rejeita confirmação divergente usando a política real", async () => {
		resetSingleton(PasswordPolicyService);
		const { useCase, userRepo } = setup(PasswordPolicyService.instance());

		await expect(
			useCase.execute({ ...input(), confirmPassword: "Outra@456a" }),
		).rejects.toThrow(/não coincidem/);
		expect(userRepo.updatePassword).not.toHaveBeenCalled();
	});

	it("rejeita reutilizar a senha atual e mantém o token", async () => {
		const { useCase, passwordHasher, userRepo, tokenRepo } = setup();
		userRepo.findById.mockResolvedValue(
			makeUser({ id: "user-1", passwordHashed: "hashed:NovaSenha@456" }),
		);

		await expect(useCase.execute(input())).rejects.toThrow(/igual a senha ja cadastrada/);
		expect(passwordHasher.hash).not.toHaveBeenCalled();
		expect(userRepo.updatePassword).not.toHaveBeenCalled();
		expect(tokenRepo.deleteById).not.toHaveBeenCalled();
	});

	it("propaga falha ao atualizar a senha e não invalida nem audita o token", async () => {
		const { useCase, userRepo, tokenRepo, auditLogRepo } = setup();
		userRepo.findById.mockResolvedValue(makeUser({ id: "user-1" }));
		userRepo.updatePassword.mockRejectedValue(new Error("MongoDB fora do ar"));

		await expect(useCase.execute(input())).rejects.toThrow("MongoDB fora do ar");
		expect(tokenRepo.deleteById).not.toHaveBeenCalled();
		expect(auditLogRepo.save).not.toHaveBeenCalled();
	});

	it("é um Singleton", () => {
		const { useCase } = setup();
		const again = ChangePasswordUseCase.instance(
			createPasswordHasherMock(),
			createUuidProviderMock(),
			createUserRepoMock(),
			createAuditLogRepoMock(),
			createTokenRepoMock(),
			{} as PasswordPolicyService,
		);
		expect(again).toBe(useCase);
	});
});
