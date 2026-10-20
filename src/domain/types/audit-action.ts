export const AuditAction = {
	CREATE: "create",
	UPDATE: "update",
	DELETE: "delete",
	RESOLVE: "resolve",
	ENABLE: "enable",
	DISABLE: "disable",
	ACTIVATE: "activate",
	DEACTIVE: "deactivate",
	LOGIN: "login",
	LOGOUT: "logout",
	CHANGE_PASSWORD: "change_password",
} as const;

export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction];
