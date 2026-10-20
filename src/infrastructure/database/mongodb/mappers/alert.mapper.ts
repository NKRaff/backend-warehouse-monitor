import { Alert } from "@domain/entities/alert.js";
import type { AlertDocument } from "../models/alert.model.js";

export function alertToDomain(raw: AlertDocument): Alert {
	return Alert.restore({
		id: raw._id,
		type: raw.type,
		severity: raw.severity,
		title: raw.title,
		description: raw.description,
		occurredAt: raw.occurredAt,
		status: raw.status,
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
