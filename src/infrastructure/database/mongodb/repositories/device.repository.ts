import type { IDeviceRepository } from "@application/repositories/device.interface.js";
import type { Device } from "@domain/entities/device.js";
import { DeviceStatus } from "@domain/types/device-status.js";
import {
	deviceToDomain,
	deviceToPersistence,
} from "../mappers/device.mapper.js";
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

	async save(device: Device): Promise<void> {
		await DeviceModel.create(deviceToPersistence(device));
	}

	async findById(mac: string): Promise<Device | null> {
		const device = await DeviceModel.findById(mac);
		return device ? deviceToDomain(device) : null;
	}
}
