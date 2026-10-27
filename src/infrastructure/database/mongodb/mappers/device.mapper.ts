import { Device } from "@domain/entities/device.js";
import type { DeviceDocument } from "../models/device.model.js";

export function deviceToDomain(raw: DeviceDocument): Device {
	return Device.restore({
		deviceStatus: raw.deviceStatus,
		mac: raw._id,
		monitoringStatus: raw.monitoringStatus,
		name: raw.name,
		...(raw.lastMeasurementId && { lastMeasurementId: raw.lastMeasurementId }),
		...(raw.warehouseId && { warehouseId: raw.warehouseId }),
	});
}

export function deviceToPersistence(device: Device): DeviceDocument {
	return {
		deviceStatus: device.deviceStatus,
		_id: device.mac,
		monitoringStatus: device.monitoringStatus,
		name: device.name,
		...(device.lastMeasurementId && {
			lastMeasurementId: device.lastMeasurementId,
		}),
		...(device.warehouseId && { warehouseId: device.warehouseId }),
	};
}
