import type { UserRole } from "../../domain/types/user-role.js";

export type TokenPayload = {
	sub: string;
	role: UserRole;
};
