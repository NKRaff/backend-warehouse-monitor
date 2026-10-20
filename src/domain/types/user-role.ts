export const UserRole = {
	OPERATOR: "operator",
	MANAGER: "manager",
	ADMINISTRATOR: "administrator",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];
