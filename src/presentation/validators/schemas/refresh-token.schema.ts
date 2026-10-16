import z from "zod";

export const RefreshTokenSchema = z.object({
	refreshToken: z.string("Refresh token deve ser uma string"),
});
