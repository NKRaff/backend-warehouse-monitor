import z from "zod";

export const LoginSchema = z.object({
	email: z.email("Formato de email invalido"),
	password: z.string("A senha deve ser uma string"),
});
