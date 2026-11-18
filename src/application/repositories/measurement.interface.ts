import type { Measurement } from "@domain/entities/measurement.js";
import type { MeasurementType } from "@domain/types/measurement-type.js";

export interface IMeasurementRepository {
	save(measurement: Measurement): Promise<void>;
	saveMany(measurements: Measurement[]): Promise<void>;
	findAll(
		filter: {
			deviceId?: string;
			warehouseId?: string;
			type?: MeasurementType;
			startDate?: Date;
			endDate?: Date;
		},
		pagination: {
			offSet: number;
			limit: number;
		} | null,
	): Promise<Measurement[]>;
}
