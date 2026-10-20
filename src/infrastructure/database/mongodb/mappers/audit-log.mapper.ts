import { AuditLog } from "@domain/entities/audit-log.js";
import type { AuditLogDocument } from "../models/audit-log.model.js";

export function auditLogToDomain(raw: AuditLogDocument): AuditLog {
	return AuditLog.restore({
		id: raw._id,
		actorId: raw.actorId,
		action: raw.action,
		resourceId: raw.resourceId,
		resourceType: raw.resourceType,
		metadata: raw.metadata ?? undefined,
		createdAt: raw.createdAt,
	});
}

export function auditLogToPersistence(
	auditLog: AuditLog,
): Omit<AuditLogDocument, "updatedAt"> {
	return {
		_id: auditLog.id,
		actorId: auditLog.actorId,
		action: auditLog.action,
		resourceId: auditLog.resourceId,
		resourceType: auditLog.resourceType,
		...(auditLog.metadata && { metadata: auditLog.metadata }),
		createdAt: auditLog.createdAt,
	};
}
