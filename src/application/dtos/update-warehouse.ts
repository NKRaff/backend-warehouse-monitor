import type { MeasurementLimits } from "@domain/object-values/measurement-limits.js";
import type { MeasurementLimit } from "@domain/types/measurement-limit.js";
import type { StorageCategory } from "@domain/types/storage-category.js";
import type { StorageCondition } from "@domain/types/storage-condition.js";
import type { WarehouseStatus } from "@domain/types/warehouse-status.js";

export type UpdateWarehouseInputDto = {
	actorId: string;
	warehouse: {
		id: string;
		name?: string | undefined;
		condition?: StorageCondition | undefined;
		category?: StorageCategory | undefined;
		status?: WarehouseStatus | undefined;
		description?: string | undefined;
		limits?: MeasurementLimits | undefined;
	};
};

export type UpdateWarehouseOutputDto = {
	message: string;
	warehouse: {
		id: string;
		name: string;
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
	};
};
