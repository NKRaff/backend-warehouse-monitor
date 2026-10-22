export interface IDeviceRepository {
	unlinkWarehouse(warehouseId: string): Promise<void>;
}
