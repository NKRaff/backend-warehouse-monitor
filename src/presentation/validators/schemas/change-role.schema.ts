import type { UserRole } from "@domain/types/user-role.js";
import z from "zod";

const roles: UserRole[] = ["operator", "manager", "administrator"];

export const ChangeRoleSchema = z.object({
	userId: z.string("O id do usuario deve ser uma string"),
	role: z.enum(roles, "A função escolhida não é valida"),
});
