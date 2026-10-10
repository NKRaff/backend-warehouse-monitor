import type { Permission } from "@application/types/permission.js";
import { PermissionMatrix } from "@application/types/permission-matrix.js";
import { ForbiddenError } from "@shared/errors/forbidden-error.js";
import { UnauthorizedError } from "@shared/errors/unauthorized-error.js";
import type { UserRepository } from "../../infraestructure/database/mongodb/repositories/user.repository.js";

export class AuthorizationPolicy {
	private static _instance: AuthorizationPolicy;

	private constructor(private userRepo: UserRepository) {}

	static instance(userRepo: UserRepository): AuthorizationPolicy {
		if (!AuthorizationPolicy._instance) {
			AuthorizationPolicy._instance = new AuthorizationPolicy(userRepo);
		}
		return AuthorizationPolicy._instance;
	}

	async hasPermission(userId: string, permission: Permission): Promise<void> {
		const user = await this.userRepo.findById(userId);

		if (!user) {
			throw new UnauthorizedError("Usuario não encontrado");
		} else if (user.deletedAt) {
			throw new ForbiddenError("Usuario não esta ativo");
		}

		if (!PermissionMatrix[user.role].includes(permission)) {
			throw new ForbiddenError(
				"O Usuario não tem permissão para executar a ação",
			);
		}
	}
}
