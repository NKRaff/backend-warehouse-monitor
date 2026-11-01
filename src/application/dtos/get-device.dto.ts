import type { DeviceStatus } from "@domain/types/device-status.js";
import type { lastMeasurements } from "@domain/types/last-measurements-ids.js";
import type { MonitoringStatus } from "@domain/types/monitoring-status.js";

export type GetDeviceInputDto = {
	deviceMac: string;
};

export type GetDeviceOutputDto = {
	message: string;
	device: {
		mac: string;
		name: string;
		warehouseId?: string | undefined;
		lastMeasurementId?: lastMeasurements | undefined;
		deviceStatus: DeviceStatus;
		monitoringStatus: MonitoringStatus;
	};
};
