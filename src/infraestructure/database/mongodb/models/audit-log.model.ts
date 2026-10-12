import { type InferSchemaType, model, Schema } from "mongoose";

const auditLog = new Schema(
	{
		_id: { type: String, required: true },
		actorId: { type: String, required: true, ref: "User" },
		action: { type: String, required: true },
		resourceId: { type: String, required: true },
		resourceType: { type: String, required: true },
		metadata: { type: Schema.Types.Mixed, required: false },
		createdAt: { type: Date, required: true },
	},
	{
		timestamps: true,
	},
);

export const AuditLogModel = model("AuditLog", auditLog);
export type AuditLogDocument = InferSchemaType<typeof auditLog>;
