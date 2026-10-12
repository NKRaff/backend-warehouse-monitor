import type { UserRole } from "@domain/types/user-role.js";
import z from "zod";

const roles: UserRole[] = ["operator", "manager", "administrator"];

export const RegisterUserSchema = z.object({
	name: z
		.string("O nome deve ser string")
		.min(4, "Nome deve ter no minimo 4 caracteres"),
	email: z.email("Formato de email invalido"),
	role: z.enum(roles, "A função escolhida não é valida"),
});
