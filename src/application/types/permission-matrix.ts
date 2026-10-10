import type { UserRole } from "@domain/types/user-role.js";
import type { Permission } from "./permission.js";

export const PermissionMatrix: Record<UserRole, Permission[]> = {
	administrator: ["permissao_temporaria_0", "permissao_temporaria_1"],

	manager: ["permissao_temporaria_0"],

	operator: ["permissao_temporaria_1"],
};
