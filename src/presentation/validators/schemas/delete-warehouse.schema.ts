import z from "zod";

export const DeleteWarehouseSchema = z.object({
	warehouseId: z.string("Id do armazém deve ser uma string"),
});
