import z from "zod";

export const UpdateUserSchema = z.object({
	userId: z.string("O id do usuario deve ser uma string"),
	name: z
		.string("O nome deve ser string")
		.min(4, "Nome deve ter no minimo 4 caracteres")
		.optional(),
	email: z.email("Formato de email invalido").optional(),
});
