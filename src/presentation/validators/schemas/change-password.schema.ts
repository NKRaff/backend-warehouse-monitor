import z from "zod";

export const ChangePasswordSchema = z.object({
	resetToken: z.string("O reset token deve ser uma string"),
	password: z.string("A senha deve ser uma string"),
	confirmPassword: z.string("A confirmação da senha deve ser uma string"),
});
