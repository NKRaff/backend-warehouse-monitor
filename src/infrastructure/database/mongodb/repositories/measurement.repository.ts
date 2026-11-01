import type { IMeasurementRepository } from "@application/repositories/measurement.interface.js";
import type { Measurement } from "@domain/entities/measurement.js";
import { measurementToPersistence } from "../mappers/measurement.model.js";
import { MeasurementModel } from "../models/measurement.model.js";

export class MeasurementRepository implements IMeasurementRepository {
	private static _instance: MeasurementRepository;

	private constructor() {}

	static instance(): MeasurementRepository {
		if (!MeasurementRepository._instance) {
			MeasurementRepository._instance = new MeasurementRepository();
		}
		return MeasurementRepository._instance;
	}

	async save(measurement: Measurement): Promise<void> {
		const model = measurementToPersistence(measurement);
		await MeasurementModel.create(model);
	}

	async saveMany(measurements: Measurement[]): Promise<void> {
		await MeasurementModel.insertMany(
			measurements.map((measurement) => {
				return measurementToPersistence(measurement);
			}),
		);
	}
}
