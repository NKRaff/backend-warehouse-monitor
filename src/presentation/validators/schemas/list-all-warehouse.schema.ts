import z from "zod";

export const ListAllWarehouseSchema = z.object({
	offSet: z.number("Offset precisa ser um numero"),
	limit: z.number("Limit precisa ser um numero"),
});
