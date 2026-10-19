import { type InferSchemaType, model, Schema } from "mongoose";

const measurementRangeSchema = new Schema(
	{
		min: { type: Number, required: true },
		max: { type: Number, required: true },
	},
	{
		_id: false,
	},
);

const limitsSchema = new Schema(
	{
		temperature: { type: measurementRangeSchema, required: true },
		humidity: { type: measurementRangeSchema, required: true },
	},
	{
		_id: false,
	},
);

const warehouseSchema = new Schema(
	{
		_id: { type: String, required: true },
		name: { type: String, required: true },
		condition: { type: String, required: true },
		category: { type: String, required: true },
		status: { type: String, required: true },
		description: { type: String, required: true },
		limits: {
			type: limitsSchema,
			required: false,
		},
		deletedAt: { type: Date, required: false },
	},
	{
		timestamps: false,
	},
);

export const WarehouseModel = model("Warehouse", warehouseSchema);
export type WarehouseDocument = InferSchemaType<typeof warehouseSchema>;
