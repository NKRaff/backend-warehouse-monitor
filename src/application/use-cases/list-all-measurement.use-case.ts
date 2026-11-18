import type {
	ListAllMeasurementInputDto,
	ListAllMeasurementOutputDto,
} from "@application/dtos/list-all-measurement.dto.js";
import type { IMeasurementRepository } from "@application/repositories/measurement.interface.js";
import type { IUseCase } from "./use-case.interface.js";

export class ListAllMeasurementUseCase
	implements IUseCase<ListAllMeasurementInputDto, ListAllMeasurementOutputDto>
{
	private static _instance: ListAllMeasurementUseCase;

	private constructor(private measurementRepo: IMeasurementRepository) {}

	static instance(deviceRepo: IMeasurementRepository) {
		if (!ListAllMeasurementUseCase._instance) {
			ListAllMeasurementUseCase._instance = new ListAllMeasurementUseCase(
				deviceRepo,
			);
		}
		return ListAllMeasurementUseCase._instance;
	}

	async execute(
		input: ListAllMeasurementInputDto,
	): Promise<ListAllMeasurementOutputDto> {
		const filter = {
			...(input.filter.deviceId && { deviceId: input.filter.deviceId }),
			...(input.filter.endDate && { endDate: input.filter.endDate }),
			...(input.filter.startDate && { startDate: input.filter.startDate }),
			...(input.filter.type && { type: input.filter.type }),
			...(input.filter.warehouseId && {
				warehouseId: input.filter.warehouseId,
			}),
		};

		const pagination = input.pagination ?? null;

		const measurements = await this.measurementRepo.findAll(filter, pagination);

		return {
			message: "Lista de medições encontradas",
			measurements: measurements.map((measurement) => ({
				id: measurement.id,
				deviceId: measurement.deviceId,
				warehouseId: measurement.warehouseId,
				type: measurement.type,
				value: measurement.value,
				createdAt: measurement.createdAt,
			})),
		};
	}
}
