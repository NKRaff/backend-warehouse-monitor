import z from "zod";

export const ChangePasswordSchema = z.object({
	password: z.string("A senha deve ser uma string"),
	confirmPassword: z.string("A confirmação da senha deve ser uma string"),
});
