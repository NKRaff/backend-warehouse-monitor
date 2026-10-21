import type { UserRole } from "@domain/types/user-role.js";
import { Permission } from "./permission.js";

export const PermissionMatrix: Record<UserRole, readonly Permission[]> = {
	administrator: [
		Permission.REGISTER_USER,
		Permission.LOGIN,
		Permission.CHANGE_PASSWORD,
		Permission.UPDATE_USER,
		Permission.CHANGE_ROLE,
		Permission.DELETE_USER,
		Permission.MANAGE_WAREHOUSE,
		Permission.LIST_WAREHOUSE,
	],

	manager: [
		Permission.LOGIN,
		Permission.CHANGE_PASSWORD,
		Permission.UPDATE_USER,
		Permission.MANAGE_WAREHOUSE,
		Permission.LIST_WAREHOUSE,
	],

	operator: [
		Permission.LOGIN,
		Permission.CHANGE_PASSWORD,
		Permission.UPDATE_USER,
		Permission.LIST_WAREHOUSE,
	],
} as const;
