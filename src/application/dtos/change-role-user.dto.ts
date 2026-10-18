import type { UserRole } from "@domain/types/user-role.js";

export type ChangeRoleInputDto = {
	actorId: string;
	userId: string;
	role: UserRole;
};

export type ChangeRoleOutputDto = {
	message: string;
};
