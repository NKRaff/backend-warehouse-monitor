import type { Measurement } from "@domain/entities/measurement.js";

export interface IMeasurementRepository {
	save(measurement: Measurement): Promise<void>;
	saveMany(measurements: Measurement[]): Promise<void>;
}
