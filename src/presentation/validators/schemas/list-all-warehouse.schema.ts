import z from "zod";

export const ListAllWarehouseSchema = z.object({
	offSet: z.coerce.number("Offset precisa ser um numero"),
	limit: z.coerce.number("Limit precisa ser um numero"),
});
