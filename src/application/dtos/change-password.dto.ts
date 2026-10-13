export type ChangePasswordInputDto = {
	actorId: string;
	password: string;
	confirmPassword: string;
};

export type ChangePasswordOutputDto = {
	message: string;
};
