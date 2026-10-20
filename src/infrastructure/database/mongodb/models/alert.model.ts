import { AlertSeverity } from "@domain/types/alert-severity.js";
import { AlertStatus } from "@domain/types/alert-status.js";
import { AlertType } from "@domain/types/alert-type.js";
import { type InferSchemaType, model, Schema } from "mongoose";

const alertSchema = new Schema(
	{
		_id: { type: String, required: true },
		type: { type: String, enum: Object.values(AlertType), required: true },
		severity: {
			type: String,
			enum: Object.values(AlertSeverity),
			required: true,
		},
		title: { type: String, required: true },
		description: { type: String, required: true },
		occurredAt: { type: Date, required: true },
		status: { type: String, enum: Object.values(AlertStatus), required: true },
		resolvedAt: { type: Date, required: false },
		resolvedById: { type: String, required: false },
	},
	{
		timestamps: false,
	},
);

export const AlertModel = model("Alert", alertSchema);
export type AlertDocument = InferSchemaType<typeof alertSchema>;
