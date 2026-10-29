export const Permission = {
	REGISTER_USER: "register_user",
	LOGIN: "login",
	CHANGE_PASSWORD: "change_password",
	UPDATE_USER: "update_user",
	CHANGE_ROLE: "change_role",
	DELETE_USER: "delete_user",
	MANAGE_WAREHOUSE: "manage_warehouse",
	LIST_WAREHOUSE: "list_warehouse",
	MANAGE_DEVICE: "manage_device",
	LIST_DEVICE: "list_device",
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];
