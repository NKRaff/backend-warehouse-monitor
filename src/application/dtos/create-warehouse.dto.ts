import type { MeasurementLimits } from "@domain/object-values/measurement-limits.js";
import type { StorageCategory } from "@domain/types/storage-category.js";
import type { StorageCondition } from "@domain/types/storage-condition.js";

export type CreateWarehouseInputDto = {
	actorId: string;
	name: string;
	condition: StorageCondition;
	category: StorageCategory;
	description?: string | undefined;
	limits?: MeasurementLimits | undefined;
};

export type CreateWarehouseOutputDto = {
	message: string;
	warehouse: {
		id: string;
		name: string;
		condition: StorageCondition;
		category: StorageCategory;
		description: string;
		limits?: MeasurementLimits | undefined;
	};
};
