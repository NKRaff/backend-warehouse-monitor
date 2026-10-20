import { UserRole } from "@domain/types/user-role.js";
import z from "zod";

export const ChangeRoleSchema = z.object({
	userId: z.string("O id do usuario deve ser uma string"),
	role: z.enum(Object.values(UserRole), "A função escolhida não é valida"),
});
