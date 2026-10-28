import { DeviceStatus } from "@domain/types/device-status.js";
import { MonitoringStatus } from "@domain/types/monitoring-status.js";
import z from "zod";

export const UpdateDeviceSchema = z.object({
	mac: z.mac("Formato do endereço mac é invalido"),
	name: z
		.string("O nome deve ser uma string")
		.min(4, "Nome deve ter no minimo 4 caracteres")
		.optional(),
	warehouseId: z.uuidv7("Formato do id do armazem invalido").optional(),
	deviceStatus: z
		.enum(Object.values(DeviceStatus), "O status do dispositivo é invalido")
		.optional(),
	monitoringStatus: z
		.enum(
			Object.values(MonitoringStatus),
			"O status de monitoramento é invalido",
		)
		.optional(),
});
