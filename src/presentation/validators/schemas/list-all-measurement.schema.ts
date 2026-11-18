import { MeasurementType } from "@domain/types/measurement-type.js";
import z from "zod";

export const ListAllMeasurementSchema = z.object({
	filter: z.object({
		deviceId: z.mac("Mac de dispositivo invalido").optional(),
		warehouseId: z.uuidv7("Id do armazem invalido").optional(),
		type: z
			.enum(
				Object.values(MeasurementType),
				"Tipo de medição escolhida invalida",
			)
			.optional(),
		startDate: z.date("Data de inicio invalida").optional(),
		endDate: z.date("Data do final invalido").optional(),
	}),
	pagination: z
		.object({
			offSet: z.coerce.number("Offset precisa ser um numero"),
			limit: z.coerce.number("Limit precisa ser um numero"),
		})
		.optional(),
});
