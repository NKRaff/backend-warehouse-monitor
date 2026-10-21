import type { IWarehouseRepository } from "@application/repositories/warehouse.interface.js";
import type { Warehouse } from "@domain/entities/warehouse.js";
import type { MeasurementLimits } from "@domain/object-values/measurement-limits.js";
import type { StorageCategory } from "@domain/types/storage-category.js";
import type { StorageCondition } from "@domain/types/storage-condition.js";
import type { WarehouseStatus } from "@domain/types/warehouse-status.js";
import {
	warehouseToDomain,
	warehouseToPersistence,
} from "../mappers/warehouse.mapper.js";
import { WarehouseModel } from "../models/warehouse.model.js";

export class WarehouseRepository implements IWarehouseRepository {
	private static _instance: WarehouseRepository;

	private constructor() {}

	static instance(): WarehouseRepository {
		if (!WarehouseRepository._instance) {
			WarehouseRepository._instance = new WarehouseRepository();
		}
		return WarehouseRepository._instance;
	}

	async save(warehouse: Warehouse): Promise<void> {
		const model = warehouseToPersistence(warehouse);
		await WarehouseModel.create(model);
	}

	async findById(id: string): Promise<Warehouse | null> {
		const warehouseModel = await WarehouseModel.findById(id);

		if (warehouseModel === null) {
			return null;
		}

		return warehouseToDomain(warehouseModel);
	}

	async findByName(name: string): Promise<Warehouse | null> {
		const warehouseModel = await WarehouseModel.findOne({
			name,
			deletedAt: { $exists: false },
		});

		if (warehouseModel === null) {
			return null;
		}

		return warehouseToDomain(warehouseModel);
	}

	async findAll(offset: number, limit: number): Promise<Warehouse[]> {
		const warehouses = await WarehouseModel.find({
			deletedAt: { $exists: false },
		})
			.skip(offset)
			.limit(limit);

		return warehouses.map((warehouse) => {
			return warehouseToDomain(warehouse);
		});
	}

	async updateById(
		id: string,
		name?: string,
		condition?: StorageCondition,
		category?: StorageCategory,
		status?: WarehouseStatus,
		description?: string,
		limits?: MeasurementLimits,
	): Promise<void> {
		await WarehouseModel.findByIdAndUpdate(id, {
			$set: {
				...(name !== undefined && { name }),
				...(condition !== undefined && { condition }),
				...(category !== undefined && { category }),
				...(status !== undefined && { status }),
				...(description !== undefined && { description }),
				...(limits !== undefined && {
					limits: {
						temperature: limits.temperature,
						humidity: limits.humidity,
					},
				}),
			},
		});
	}

	async deletedById(id: string): Promise<void> {
		await WarehouseModel.findByIdAndUpdate(id, { deletedAt: new Date() });
	}
}
