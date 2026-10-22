import type { IDeviceRepository } from "@application/repositories/device.interface.js";
import { DeviceStatus } from "@domain/types/device-status.js";
import { DeviceModel } from "../models/device.model.js";

export class DeviceRepository implements IDeviceRepository {
	private static _instance: DeviceRepository;

	private constructor() {}

	static instance(): DeviceRepository {
		if (!DeviceRepository._instance) {
			DeviceRepository._instance = new DeviceRepository();
		}
		return DeviceRepository._instance;
	}

	async unlinkWarehouse(warehouseId: string): Promise<void> {
		await DeviceModel.updateMany(
			{ warehouseId },
			{
				$set: { deviceStatus: DeviceStatus.OFFLINE },
				$unset: { warehouseId: "" },
			},
		);
	}
}
