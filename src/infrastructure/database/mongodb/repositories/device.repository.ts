import type { IDeviceRepository } from "@application/repositories/device.interface.js";
import type { Device } from "@domain/entities/device.js";
import { DeviceStatus } from "@domain/types/device-status.js";
import type { MonitoringStatus } from "@domain/types/monitoring-status.js";
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

	async updateById(device: {
		mac: string;
		name?: string;
		warehouseId?: string;
		lastMeasurementId?: string;
		deviceStatus?: DeviceStatus;
		monitoringStatus?: MonitoringStatus;
	}): Promise<void> {
		await DeviceModel.findByIdAndUpdate(device.mac, {
			$set: {
				...(device.name && { name: device.name }),
				...(device.warehouseId && { warehouseId: device.warehouseId }),
				...(device.lastMeasurementId && {
					lastMeasurementId: device.lastMeasurementId,
				}),
				...(device.deviceStatus && { deviceStatus: device.deviceStatus }),
				...(device.monitoringStatus && {
					monitoringStatus: device.monitoringStatus,
				}),
			},
		});
	}

	async deleteById(mac: string): Promise<void> {
		await DeviceModel.findByIdAndDelete(mac);
	}

	async findAll(offset: number, limit: number): Promise<Device[]> {
		const devices = await DeviceModel.find().skip(offset).limit(limit);

		return devices.map((device) => {
			return deviceToDomain(device);
		});
	}
}
