import { PasswordPolicyService } from "@application/services/password-policy.service.js";
import { ChangePasswordUseCase } from "@application/use-cases/change-password.use-case.js";
import { NotFoundError } from "@shared/errors/not-found-error.js";
import { UnprocessableEntityError } from "@shared/errors/unprocessable-entity-error.js";
import { describe, expect, it, vi } from "vitest";
import { makeUser } from "../../../helpers/factories.js";
import {
	createAuditLogRepoMock,
	createPasswordHasherMock,
	createUserRepoMock,
	createUuidProviderMock,
} from "../../../helpers/mocks.js";
import { resetSingleton } from "../../../helpers/singleton.js";

function setup(policy?: PasswordPolicyService) {
	resetSingleton(ChangePasswordUseCase);

	const passwordHasher = createPasswordHasherMock();
	const uuidProvider = createUuidProviderMock();
	const userRepo = createUserRepoMock();
	const auditLogRepo = createAuditLogRepoMock();
	const policyStub = {
		isValid: vi.fn<PasswordPolicyService["isValid"]>().mockReturnValue(true),
	};

	const useCase = ChangePasswordUseCase.instance(
		passwordHasher,
		uuidProvider,
		userRepo,
		auditLogRepo,
		policy ?? (policyStub as unknown as PasswordPolicyService),
	);

	return { useCase, passwordHasher, userRepo, auditLogRepo, policyStub };
}

const input = () => ({
	actorId: "user-1",
	password: "NovaSenha@456",
	confirmPassword: "NovaSenha@456",
});

describe("ChangePasswordUseCase — RF-BE-004", () => {
	describe("caminho feliz", () => {
		it("valida a política, grava o hash e libera o usuário da senha temporária", async () => {
			const { useCase, policyStub, passwordHasher, userRepo } = setup();
			const user = makeUser({
				id: "user-1",
				role: "manager",
				isDefaultPassword: true,
			});
			userRepo.findById.mockResolvedValue(user);

			const result = await useCase.execute(input());

			expect(policyStub.isValid).toHaveBeenCalledWith(
				"NovaSenha@456",
				"NovaSenha@456",
			);
			expect(passwordHasher.hash).toHaveBeenCalledWith("NovaSenha@456");
			expect(userRepo.updatePassword).toHaveBeenCalledExactlyOnceWith(
				"user-1",
				"hashed:NovaSenha@456",
			);
			expect(result).toEqual({ message: "Nova senha definida com sucesso" });
		});

		it("audita a troca de senha (RF-BE-031)", async () => {
			const { useCase, auditLogRepo, userRepo } = setup();
			const user = makeUser({
				id: "user-1",
				role: "manager",
				isDefaultPassword: true,
			});
			userRepo.findById.mockResolvedValue(user);

			await useCase.execute(input());

			const log = auditLogRepo.save.mock.calls[0]?.[0];
			expect(auditLogRepo.save).toHaveBeenCalledTimes(1);
			expect(log?.actorId).toBe("user-1");
			expect(log?.action).toBe("change_password");
			expect(log?.resourceId).toBe("user-1");
			expect(log?.resourceType).toBe("user");
		});

		it("nunca persiste a senha em texto puro", async () => {
			const { useCase, userRepo } = setup();
			const user = makeUser({
				id: "user-1",
				role: "manager",
				isDefaultPassword: true,
			});
			userRepo.findById.mockResolvedValue(user);

			await useCase.execute(input());

			expect(userRepo.updatePassword.mock.calls[0]?.[1]).not.toBe(
				"NovaSenha@456",
			);
		});
	});

	describe("política de senha reprovada", () => {
		it("interrompe o fluxo antes de gerar hash, gravar ou auditar", async () => {
			const { useCase, policyStub, passwordHasher, userRepo, auditLogRepo } =
				setup();
			policyStub.isValid.mockImplementation(() => {
				throw new UnprocessableEntityError("Senha invalida: muito curta");
			});

			await expect(useCase.execute(input())).rejects.toThrow(
				"Senha invalida: muito curta",
			);

			expect(passwordHasher.hash).not.toHaveBeenCalled();
			expect(userRepo.updatePassword).not.toHaveBeenCalled();
			expect(auditLogRepo.save).not.toHaveBeenCalled();
		});
	});

	describe("com a PasswordPolicyService real", () => {
		it("rejeita senha fraca", async () => {
			resetSingleton(PasswordPolicyService);
			const { useCase, userRepo } = setup(PasswordPolicyService.instance());

			await expect(
				useCase.execute({
					...input(),
					password: "123",
					confirmPassword: "123",
				}),
			).rejects.toThrow(/Senha invalida/);

			expect(userRepo.updatePassword).not.toHaveBeenCalled();
		});

		it("rejeita confirmação divergente", async () => {
			resetSingleton(PasswordPolicyService);
			const { useCase, userRepo } = setup(PasswordPolicyService.instance());

			await expect(
				useCase.execute({ ...input(), confirmPassword: "Outra@456a" }),
			).rejects.toThrow(/não coincidem/);

			expect(userRepo.updatePassword).not.toHaveBeenCalled();
		});

		it("aceita senha forte", async () => {
			resetSingleton(PasswordPolicyService);
			const { useCase, userRepo } = setup(PasswordPolicyService.instance());
			const user = makeUser({
				id: "user-1",
				role: "manager",
				isDefaultPassword: true,
			});
			userRepo.findById.mockResolvedValue(user);

			await expect(useCase.execute(input())).resolves.toEqual({
				message: "Nova senha definida com sucesso",
			});

			expect(userRepo.updatePassword).toHaveBeenCalledTimes(1);
		});
	});

	it("propaga falha de persistência e não audita", async () => {
		const { useCase, userRepo, auditLogRepo } = setup();
		userRepo.updatePassword.mockRejectedValue(
			new NotFoundError("Usuario não encontrado"),
		);

		await expect(useCase.execute(input())).rejects.toThrow(
			"Usuario não encontrado",
		);

		expect(auditLogRepo.save).not.toHaveBeenCalled();
	});

	it("é um Singleton", () => {
		const { useCase } = setup();

		const again = ChangePasswordUseCase.instance(
			createPasswordHasherMock(),
			createUuidProviderMock(),
			createUserRepoMock(),
			createAuditLogRepoMock(),
			{} as PasswordPolicyService,
		);

		expect(again).toBe(useCase);
	});
});
