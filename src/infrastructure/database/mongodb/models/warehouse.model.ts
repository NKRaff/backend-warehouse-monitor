import { StorageCategory } from "@domain/types/storage-category.js";
import { StorageCondition } from "@domain/types/storage-condition.js";
import { WarehouseStatus } from "@domain/types/warehouse-status.js";
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
		condition: {
			type: String,
			enum: Object.values(StorageCondition),
			required: true,
		},
		category: {
			type: String,
			enum: Object.values(StorageCategory),
			required: true,
		},
		status: {
			type: String,
			enum: Object.values(WarehouseStatus),
			required: true,
		},
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
