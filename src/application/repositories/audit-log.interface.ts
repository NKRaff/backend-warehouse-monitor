import type { AuditLog } from "@domain/entities/audit-log.js";

export interface IAuditLogRepository {
	save(log: AuditLog): Promise<void>;
}
