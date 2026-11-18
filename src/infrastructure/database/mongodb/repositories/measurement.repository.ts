import type { IMeasurementRepository } from "@application/repositories/measurement.interface.js";
import type { Measurement } from "@domain/entities/measurement.js";
import type { MeasurementType } from "@domain/types/measurement-type.js";
import type { QueryFilter } from "mongoose";
import {
	measurementToDomain,
	measurementToPersistence,
} from "../mappers/measurement.model.js";
import {
	type MeasurementDocument,
	MeasurementModel,
} from "../models/measurement.model.js";

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

	async findAll(
		filter: {
			deviceId?: string;
			warehouseId?: string;
			type?: MeasurementType;
			startDate?: Date;
			endDate?: Date;
		},
		pagination: { offSet: number; limit: number } | null,
	): Promise<Measurement[]> {
		const query: QueryFilter<MeasurementDocument> = {
			...(filter.deviceId && { deviceId: filter.deviceId }),
			...(filter.warehouseId && { warehouseId: filter.warehouseId }),
			...(filter.type && { type: filter.type }),
			...(filter.startDate && { createdAt: { $gte: filter.startDate } }),
			...(filter.endDate && { createdAt: { $lte: filter.endDate } }),
		};

		let request = MeasurementModel.find(query);

		if (pagination) {
			request = request.skip(pagination.offSet).limit(pagination.limit);
		}

		const measurements = await request.exec();

		return measurements.map((measurement) => {
			return measurementToDomain(measurement);
		});
	}
}
