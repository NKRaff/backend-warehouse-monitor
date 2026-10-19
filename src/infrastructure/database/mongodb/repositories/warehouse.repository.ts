import type { IWarehouseRepository } from "@application/repositories/warehouse.interface.js";
import type { Warehouse } from "@domain/entities/warehouse.js";
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

	async findByName(name: string): Promise<Warehouse | null> {
		const warehouseModel = await WarehouseModel.findOne({ name });

		if (warehouseModel === null) {
			return null;
		}

		return warehouseToDomain(warehouseModel);
	}
}
