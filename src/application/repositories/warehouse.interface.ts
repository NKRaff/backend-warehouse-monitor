import type { Warehouse } from "@domain/entities/warehouse.js";
import type { MeasurementLimits } from "@domain/object-values/measurement-limits.js";
import type { StorageCategory } from "@domain/types/storage-category.js";
import type { StorageCondition } from "@domain/types/storage-condition.js";
import type { WarehouseStatus } from "@domain/types/warehouse-status.js";

export interface IWarehouseRepository {
	save(warehouse: Warehouse): Promise<void>;
	findById(id: string): Promise<Warehouse | null>;
	findByName(name: string): Promise<Warehouse | null>;
	updateById(
		id: string,
		name?: string,
		condition?: StorageCondition,
		category?: StorageCategory,
		status?: WarehouseStatus,
		description?: string,
		limits?: MeasurementLimits,
	): Promise<void>;
	deletedById(id: string): Promise<void>;
}
