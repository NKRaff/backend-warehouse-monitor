export type RefreshTokenInputDto = {
	refreshToken: string;
};

export type RefreshTokenOutputDto = {
	message: string;
	accessToken: string;
	refreshToken: string;
};
