import type { UserRole } from "@domain/types/user-role.js";
import type { Permission } from "./permission.js";

export const PermissionMatrix: Record<UserRole, Permission[]> = {
	administrator: [
		"register_user",
		"change_password",
		"login",
		"update_user",
		"change_role",
		"delete_user",
	],

	manager: ["change_password", "login", "update_user"],

	operator: ["change_password", "login", "update_user"],
};
