import { type InferSchemaType, model, Schema } from "mongoose";

const alertSchema = new Schema(
	{
		_id: { type: String, required: true },
		type: { type: String, required: true },
		severity: { type: String, required: true },
		title: { type: String, required: true },
		description: { type: String, required: true },
		occurredAt: { type: Date, required: true },
		status: { type: String, required: true },
		resolvedAt: { type: Date, required: false },
		resolvedById: { type: String, required: false },
	},
	{
		timestamps: false,
	},
);

export const AlertModel = model("Alert", alertSchema);
export type AlertDocument = InferSchemaType<typeof alertSchema>;
