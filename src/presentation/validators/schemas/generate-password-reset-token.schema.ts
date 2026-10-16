import z from "zod";

export const GeneratePasswordResetTokenSchema = z.object({
	email: z.email("Email invalido"),
});
