import type { UserRole } from "@domain/types/user-role.js";

export type LoginInputDto = {
	email: string;
	password: string;
};

export type LoginOutputDto = {
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
	accessToken: string;
	requiresPasswordChange: boolean;
};
