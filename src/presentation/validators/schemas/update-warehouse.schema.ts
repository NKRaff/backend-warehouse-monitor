import { StorageCategory } from "@domain/types/storage-category.js";
import { StorageCondition } from "@domain/types/storage-condition.js";
import { WarehouseStatus } from "@domain/types/warehouse-status.js";
import z from "zod";

export const UpdateWarehouseSchema = z.object({
	id: z.string("O id do usuario deve ser uma string"),
	name: z
		.string("O nome deve ser string")
		.min(4, "Nome deve ter no minimo 4 caracteres")
		.optional(),
	condition: z
		.enum(Object.values(StorageCondition), "A condição escolhida não é valida")
		.optional(),
	category: z
		.enum(Object.values(StorageCategory), "A categoria escolhida não é valida")
		.optional(),
	status: z
		.enum(Object.values(WarehouseStatus), "O status escolhido não é valida")
		.optional(),
	description: z
		.string("A descrição deve ser string")
		.min(4, "A descrição deve ter no minimo 4 caracteres")
		.optional(),
	limits: z
		.object({
			temperature: z.object({
				min: z.number("O valor minimo de temperatura deve ser um numero"),
				max: z.number("O valor maximo de temperatura deve ser um numero"),
			}),
			humidity: z.object({
				min: z.number("O valor minimo de umidade deve ser um numero"),
				max: z.number("O valor maximo de umidade deve ser um numero"),
			}),
		})
		.optional(),
});
