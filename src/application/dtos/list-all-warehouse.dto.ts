import type { StorageCategory } from "@domain/types/storage-category.js";
import type { StorageCondition } from "@domain/types/storage-condition.js";
import type { WarehouseStatus } from "@domain/types/warehouse-status.js";

export type ListAllWarehouseInputDto = {
	offSet: number;
	limit: number;
};

export type ListAllWarehouseOutputDto = {
	message: string;
	warehouses: {
		id: string;
		name: string;
		category: StorageCategory;
		condition: StorageCondition;
		status: WarehouseStatus;
	}[];
};
