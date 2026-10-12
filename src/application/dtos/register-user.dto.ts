import type { UserRole } from "@domain/types/user-role.js";

export type RegisterUserInputDto = {
	actorId: string;
	name: string;
	email: string;
	role: UserRole;
};

export type RegisterUserOutputDto = {
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
