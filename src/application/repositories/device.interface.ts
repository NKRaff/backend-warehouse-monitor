import type { Device } from "@domain/entities/device.js";

export interface IDeviceRepository {
	unlinkWarehouse(warehouseId: string): Promise<void>;
	save(device: Device): Promise<void>;
	findById(mac: string): Promise<Device | null>;
}
