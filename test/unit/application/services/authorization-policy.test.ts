import { AuthorizationPolicy } from "@application/services/authorization-policy.js";
import type { Permission } from "@application/types/permission.js";
import type { UserRole } from "@domain/types/user-role.js";
import { ForbiddenError } from "@shared/errors/forbidden-error.js";
import { UnauthorizedError } from "@shared/errors/unauthorized-error.js";
import { beforeEach, describe, expect, it } from "vitest";
import { makeUser } from "../../../helpers/factories.js";
import { createUserRepoMock } from "../../../helpers/mocks.js";
import { resetSingleton } from "../../../helpers/singleton.js";

type PolicyDependency = Parameters<typeof AuthorizationPolicy.instance>[0];

describe("AuthorizationPolicy (RBAC) — RF-BE-007", () => {
	let userRepo: ReturnType<typeof createUserRepoMock>;
	let policy: AuthorizationPolicy;

	beforeEach(() => {
		resetSingleton(AuthorizationPolicy);
		userRepo = createUserRepoMock();
		policy = AuthorizationPolicy.instance(userRepo as unknown as PolicyDependency);
	});

	it("rejeita (401) quando o usuário do token não existe mais", async () => {
		userRepo.findById.mockResolvedValue(null);

		await expect(policy.hasPermission("user-1", "login")).rejects.toThrow(
			UnauthorizedError,
		);
		await expect(policy.hasPermission("user-1", "login")).rejects.toThrow(
			"Usuario não encontrado",
		);
	});

	it("rejeita (403) usuário removido (soft delete), mesmo com o papel certo", async () => {
		userRepo.findById.mockResolvedValue(
			makeUser({ role: "administrator", deletedAt: new Date() }),
		);

		await expect(
			policy.hasPermission("user-1", "register_user"),
		).rejects.toThrow(ForbiddenError);
		await expect(
			policy.hasPermission("user-1", "register_user"),
		).rejects.toThrow("Usuario não esta ativo");
	});

	it("consulta o usuário a cada chamada, refletindo mudanças de papel durante a sessão", async () => {
		userRepo.findById.mockResolvedValueOnce(makeUser({ role: "manager" }));
		await expect(
			policy.hasPermission("user-1", "register_user"),
		).rejects.toThrow(ForbiddenError);

		userRepo.findById.mockResolvedValueOnce(makeUser({ role: "administrator" }));
		await expect(
			policy.hasPermission("user-1", "register_user"),
		).resolves.toBeUndefined();

		expect(userRepo.findById).toHaveBeenCalledTimes(2);
		expect(userRepo.findById).toHaveBeenCalledWith("user-1");
	});

	describe("matriz de permissões", () => {
		const matrix: [UserRole, Permission, boolean][] = [
			["administrator", "register_user", true],
			["manager", "register_user", false],
			["operator", "register_user", false],
			["administrator", "login", true],
			["manager", "login", true],
			["operator", "login", true],
			["administrator", "change_password", true],
			["manager", "change_password", true],
			["operator", "change_password", true],
			["administrator", "manager_warehouse", true],
			["manager", "manager_warehouse", true],
			["operator", "manager_warehouse", false],
		];

		it.each(matrix)("%s + %s => %s", async (role, permission, allowed) => {
			userRepo.findById.mockResolvedValue(makeUser({ role }));

			const result = policy.hasPermission("user-1", permission);

			if (allowed) {
				await expect(result).resolves.toBeUndefined();
			} else {
				await expect(result).rejects.toThrow(
					"O Usuario não tem permissão para executar a ação",
				);
			}
		});
	});

	it("é um Singleton", () => {
		expect(AuthorizationPolicy.instance({} as PolicyDependency)).toBe(policy);
	});
});
