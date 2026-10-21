import z from "zod";

export const GetWarehouseSchema = z.object({
	warehouseId: z.uuidv7("Id do armazém invalido"),
	offSet: z.number("OffSet deve ser um numero"),
	limit: z.number("Limit deve ser um numero"),
});
