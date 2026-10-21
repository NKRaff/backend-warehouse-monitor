import z from "zod";

export const GetWarehouseSchema = z.object({
	warehouseId: z.uuidv7("Id do armazém invalido"),
});
