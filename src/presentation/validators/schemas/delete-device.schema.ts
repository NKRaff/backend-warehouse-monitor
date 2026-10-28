import z from "zod";

export const DeleteDeviceSchema = z.object({
	deviceId: z.mac("Formato do id do dispositivo invalido"),
});
