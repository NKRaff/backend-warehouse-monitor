import z from "zod";

export const CreateDeviceSchema = z.object({
	mac: z.mac("Endereço MAC invalido"),
	name: z
		.string("O nome precisa ser uma string")
		.min(4, "O nome deve ter no minimo 4 caracteres"),
	warehouseId: z.uuidv7("Formato do id do armazem invalido").optional(),
});
