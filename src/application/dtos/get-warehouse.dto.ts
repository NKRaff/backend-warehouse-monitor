import type { MeasurementLimit } from "@domain/types/measurement-limit.js";
import type { StorageCategory } from "@domain/types/storage-category.js";
import type { StorageCondition } from "@domain/types/storage-condition.js";
import type { WarehouseStatus } from "@domain/types/warehouse-status.js";

export type GetWarehouseInputDto = {
	warehouseId: string;
};

export type GetWarehouseOutputDto = {
	message: string;
	warehouse: {
		id: string;
		condition: StorageCondition;
		category: StorageCategory;
		status: WarehouseStatus;
		description: string;
		limits?:
			| {
					temperature: MeasurementLimit;
					humidity: MeasurementLimit;
			  }
			| undefined;
		deletedAt?: Date | undefined;
	};
};
