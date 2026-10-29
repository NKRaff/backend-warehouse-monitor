import z from "zod";

export const GetDeviceSchema = z.object({
	deviceMac: z.mac("Endereço mac invalido"),
});
