import type { Device } from "@domain/entities/device.js";
import type { DeviceStatus } from "@domain/types/device-status.js";
import type { MonitoringStatus } from "@domain/types/monitoring-status.js";

export interface IDeviceRepository {
	unlinkWarehouse(warehouseId: string): Promise<void>;
	save(device: Device): Promise<void>;
	findById(mac: string): Promise<Device | null>;
	updateById(device: {
		mac: string;
		name?: string;
		warehouseId?: string;
		lastMeasurementId?: string;
		deviceStatus?: DeviceStatus;
		monitoringStatus?: MonitoringStatus;
	}): Promise<void>;
	deleteById(mac: string): Promise<void>;
}
