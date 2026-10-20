export const TokenType = {
	ACCESS: "access",
	REFRESH: "refresh",
	PASSWORD_RESET: "password_reset",
	EMAIL_VERIFICATION: "email_verification",
} as const;

export type TokenType = (typeof TokenType)[keyof typeof TokenType];
