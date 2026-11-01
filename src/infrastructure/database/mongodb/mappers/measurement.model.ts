import { Measurement } from "@domain/entities/measurement.js";
import type { MeasurementDocument } from "../models/measurement.model.js";

export function measurementToDomain(raw: MeasurementDocument): Measurement {
	return Measurement.restore({
		createdAt: raw.createdAt,
		deviceId: raw.deviceId,
		warehouseId: raw.warehouseId,
		type: raw.type,
		value: raw.value,
		id: raw._id,
	});
}

export function measurementToPersistence(
	measurement: Measurement,
): MeasurementDocument {
	return {
		_id: measurement.id,
		deviceId: measurement.deviceId,
		warehouseId: measurement.warehouseId,
		type: measurement.type,
		value: measurement.value,
		createdAt: measurement.createdAt,
	};
}
