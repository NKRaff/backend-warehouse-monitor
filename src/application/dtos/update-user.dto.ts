import type { UserRole } from "@domain/types/user-role.js";

export type UpdateUserInputDto = {
	userId: string;
	name?: string | undefined;
	email?: string | undefined;
};

export type UpdateUserOutputDto = {
	message: string;
	user: {
		id: string;
		name: string;
		email: {
			value: string;
			isVerified: boolean;
		};
		role: UserRole;
	};
};
