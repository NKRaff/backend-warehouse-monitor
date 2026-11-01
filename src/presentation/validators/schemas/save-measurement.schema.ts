import z from "zod";

export const SaveMeasurementSchema = z.object({
	createdAt: z.date("Formato da data é invalida"),
	deviceId: z.mac("Endereço mac do dispositivo é invalido"),
	values: z.object({
		temperature: z.number("Temperatura percisa ser um numero"),
		humidity: z.number("Umidade percisa ser um numero"),
	}),
});
