import type { DeviceStatus } from "@domain/types/device-status.js";
import type { MonitoringStatus } from "@domain/types/monitoring-status.js";

export type UpdateDeviceInputDto = {
	actorId: string;
	device: {
		mac: string;
		name?: string | undefined;
		warehouseId?: string | undefined;
		deviceStatus?: DeviceStatus | undefined;
		monitoringStatus?: MonitoringStatus | undefined;
	};
};

export type UpdateDeviceOutputDto = {
	message: string;
	device: {
		mac: string;
		name: string;
		warehouseId?: string | undefined;
		lastMeasurementId?: string | undefined;
		deviceStatus: DeviceStatus;
		monitoringStatus: MonitoringStatus;
	};
};
