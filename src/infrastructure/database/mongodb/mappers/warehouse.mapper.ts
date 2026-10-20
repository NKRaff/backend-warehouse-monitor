import { Warehouse } from "@domain/entities/warehouse.js";
import { MeasurementLimits } from "@domain/object-values/measurement-limits.js";
import type { WarehouseDocument } from "../models/warehouse.model.js";

export function warehouseToDomain(raw: WarehouseDocument): Warehouse {
	return Warehouse.restore({
		id: raw._id,
		name: raw.name,
		condition: raw.condition,
		category: raw.category,
		status: raw.status,
		description: raw.description,
		...(raw.limits && {
			limits: new MeasurementLimits(
				{
					min: raw.limits.temperature.min,
					max: raw.limits.temperature.max,
				},
				{
					min: raw.limits.humidity.min,
					max: raw.limits.humidity.max,
				},
			),
		}),
		...(raw.deletedAt && { deletedAt: raw.deletedAt }),
	});
}

export function warehouseToPersistence(
	warehouse: Warehouse,
): WarehouseDocument {
	return {
		_id: warehouse.id,
		category: warehouse.category,
		condition: warehouse.condition,
		description: warehouse.description,
		name: warehouse.name,
		status: warehouse.status,
		...(warehouse.limits && {
			limits: {
				temperature: warehouse.limits.temperature,
				humidity: warehouse.limits.humidity,
			},
		}),
		...(warehouse.deletedAt && { deletedAt: warehouse.deletedAt }),
	};
}
