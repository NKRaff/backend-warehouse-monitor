import type { IAuditLogRepository } from "@application/repositories/audit-log.interface.js";
import type { AuditLog } from "@domain/entities/audit-log.js";
import { auditLogToPersistence } from "../mappers/audit-log.mapper.js";
import { AuditLogModel } from "../models/audit-log.model.js";

export class AuditLogRepository implements IAuditLogRepository {
	private static _instance: AuditLogRepository;

	private constructor() {}

	static instance(): AuditLogRepository {
		if (!AuditLogRepository._instance) {
			AuditLogRepository._instance = new AuditLogRepository();
		}
		return AuditLogRepository._instance;
	}

	async save(auditlog: AuditLog): Promise<void> {
		const model = auditLogToPersistence(auditlog);
		await AuditLogModel.create(model);
	}
}
