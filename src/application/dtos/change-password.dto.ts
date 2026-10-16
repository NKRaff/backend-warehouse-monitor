export type ChangePasswordInputDto = {
	resetToken: string;
	password: string;
	confirmPassword: string;
};

export type ChangePasswordOutputDto = {
	message: string;
};
