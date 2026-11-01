import type { DeviceStatus } from "@domain/types/device-status.js";
import type { lastMeasurements } from "@domain/types/last-measurements-ids.js";
import type { MonitoringStatus } from "@domain/types/monitoring-status.js";

export type ListAllDeviceInputDto = {
	offSet: number;
	limit: number;
};

export type ListAllDeviceOutputDto = {
	message: string;
	devices: {
		mac: string;
		name: string;
		warehouseId?: string | undefined;
		lastMeasurementId?: lastMeasurements | undefined;
		deviceStatus: DeviceStatus;
		monitoringStatus: MonitoringStatus;
	}[];
};
