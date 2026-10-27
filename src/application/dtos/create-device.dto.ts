import type { DeviceStatus } from "@domain/types/device-status.js";
import type { MonitoringStatus } from "@domain/types/monitoring-status.js";

export type CreateDeviceInputDto = {
	actorId: string;
	device: {
		mac: string;
		name: string;
		warehouseId?: string | undefined;
	};
};

export type CreateDeviceOutputDto = {
	message: string;
	device: {
		mac: string;
		name: string;
		deviceStatus: DeviceStatus;
		monitoringStatus: MonitoringStatus;
	};
};
