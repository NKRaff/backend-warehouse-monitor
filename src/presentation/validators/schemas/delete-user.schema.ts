import z from "zod";

export const DeleteUserSchema = z.object({
	userId: z.string("O id do usuario deve ser uma string"),
});
