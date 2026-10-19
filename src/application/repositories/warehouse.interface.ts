import type { Warehouse } from "@domain/entities/warehouse.js";

export interface IWarehouseRepository {
	save(warehouse: Warehouse): Promise<void>;
	findByName(name: string): Promise<Warehouse | null>;
	deletedById(id: string): Promise<void>;
}
