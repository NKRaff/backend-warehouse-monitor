import { Alert } from "@domain/entities/alert.js";
import type { AlertSeverity } from "@domain/types/alert-severity.js";
import type { AlertStatus } from "@domain/types/alert-status.js";
import type { AlertType } from "@domain/types/alert-type.js";
import type { AlertDocument } from "../models/alert.model.js";

export function alertToDomain(raw: AlertDocument): Alert {
	return Alert.restore({
		id: raw._id,
		type: raw.type as AlertType,
		severity: raw.severity as AlertSeverity,
		title: raw.title,
		description: raw.description,
		occurredAt: raw.occurredAt,
		status: raw.status as AlertStatus,
		resolvedAt: raw.resolvedAt ?? undefined,
		resolvedById: raw.resolvedById ?? undefined,
	});
}

export function alertToPersistence(alert: Alert): AlertDocument {
	return {
		_id: alert.id,
		type: alert.type,
		severity: alert.severity,
		title: alert.title,
		description: alert.description,
		occurredAt: alert.occurredAt,
		status: alert.status,
		...(alert.resolvedAt && { resolvedAt: alert.resolvedAt }),
		...(alert.resolvedById && { resolvedById: alert.resolvedById }),
	};
}
