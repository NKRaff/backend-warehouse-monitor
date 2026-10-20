import { StorageCategory } from "@domain/types/storage-category.js";
import { StorageCondition } from "@domain/types/storage-condition.js";
import z from "zod";

export const CreateWarehouseSchema = z.object({
	name: z
		.string("O nome deve ser string")
		.min(4, "Nome deve ter no minimo 4 caracteres"),
	category: z.enum(
		Object.values(StorageCategory),
		"A categoria escolhida não é valida",
	),
	condition: z.enum(
		Object.values(StorageCondition),
		"A condição escolhida não é valida",
	),
	description: z.string("A descrição deve ser uma string").optional(),
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
