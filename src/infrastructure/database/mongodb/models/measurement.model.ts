import { MeasurementType } from "@domain/types/measurement-type.js";
import { type InferSchemaType, model, Schema } from "mongoose";

const measurementSchema = new Schema(
	{
		_id: { type: String, required: true },
		deviceId: { type: String, required: true, ref: "Device" },
		warehouseId: { type: String, required: true, ref: "Warehouse" },
		type: {
			type: String,
			enum: Object.values(MeasurementType),
			required: true,
		},
		value: { type: Number, required: true },
		createdAt: { type: Date, required: true },
	},
	{
		timestamps: false,
	},
);

export const MeasurementModel = model("Measurement", measurementSchema);
export type MeasurementDocument = InferSchemaType<typeof measurementSchema>;
