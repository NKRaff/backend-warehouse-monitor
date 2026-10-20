import { AuditAction } from "@domain/types/audit-action.js";
import { AuditResource } from "@domain/types/audit-resource.js";
import { type InferSchemaType, model, Schema } from "mongoose";

const auditLog = new Schema(
	{
		_id: { type: String, required: true },
		actorId: { type: String, required: true, ref: "User" },
		action: { type: String, enum: Object.values(AuditAction), required: true },
		resourceId: { type: String, required: true },
		resourceType: {
			type: String,
			enum: Object.values(AuditResource),
			required: true,
		},
		metadata: { type: Schema.Types.Mixed, required: false },
		createdAt: { type: Date, required: true },
	},
	{
		timestamps: true,
	},
);

export const AuditLogModel = model("AuditLog", auditLog);
export type AuditLogDocument = InferSchemaType<typeof auditLog>;
