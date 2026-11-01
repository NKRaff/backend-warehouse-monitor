import type {
	SaveMeasurementInputDto,
	SaveMeasurementOutputDto,
} from "@application/dtos/save-measurement.dto.js";
import type { IUuidProvider } from "@application/ports/uuid-provider.interface.js";
import type { IDeviceRepository } from "@application/repositories/device.interface.js";
import type { IMeasurementRepository } from "@application/repositories/measurement.interface.js";
import type { IWarehouseRepository } from "@application/repositories/warehouse.interface.js";
import { Measurement } from "@domain/entities/measurement.js";
import { WarehouseStatus } from "@domain/types/warehouse-status.js";
import { NotFoundError } from "@shared/errors/not-found-error.js";
import { UnprocessableEntityError } from "@shared/errors/unprocessable-entity-error.js";
import type { IUseCase } from "./use-case.interface.js";

export class SaveMeasurementUseCase
	implements IUseCase<SaveMeasurementInputDto, SaveMeasurementOutputDto>
{
	private static _instance: SaveMeasurementUseCase;

	private constructor(
		private readonly uuidProvider: IUuidProvider,
		private readonly deviceRepo: IDeviceRepository,
		private readonly warehouseRepo: IWarehouseRepository,
		private readonly measurementRepo: IMeasurementRepository,
	) {}

	static instance(
		uuidProvider: IUuidProvider,
		userRepo: IDeviceRepository,
		warehouseRepo: IWarehouseRepository,
		measurementRepo: IMeasurementRepository,
	): SaveMeasurementUseCase {
		if (!SaveMeasurementUseCase._instance) {
			SaveMeasurementUseCase._instance = new SaveMeasurementUseCase(
				uuidProvider,
				userRepo,
				warehouseRepo,
				measurementRepo,
			);
		}
		return SaveMeasurementUseCase._instance;
	}

	async execute(
		input: SaveMeasurementInputDto,
	): Promise<SaveMeasurementOutputDto> {
		const device = await this.deviceRepo.findById(input.deviceId);

		if (device === null) {
			throw new NotFoundError("Dispositivo não encontrado");
		}

		if (!device.warehouseId) {
			throw new UnprocessableEntityError(
				"Nenhum armazem vinculado a esse dispositivo",
			);
		}

		const warehouse = await this.warehouseRepo.findById(device.warehouseId);

		if (warehouse === null) {
			throw new NotFoundError(
				"Armazem vinculado ao dispositivo não foi encontrado",
			);
		}

		if (warehouse.status !== WarehouseStatus.ACTIVE) {
			throw new UnprocessableEntityError(
				"Monitoramento do armazem esta desativado",
			);
		}

		const measurementHumidity = Measurement.create({
			createdAt: input.createdAt,
			deviceId: device.mac,
			id: this.uuidProvider.generate(),
			type: "humidity",
			value: input.values.humidity,
			warehouseId: warehouse.id,
		});

		const measurementTemperature = Measurement.create({
			createdAt: input.createdAt,
			deviceId: device.mac,
			id: this.uuidProvider.generate(),
			type: "temperature",
			value: input.values.temperature,
			warehouseId: warehouse.id,
		});

		device.lastMeasurementId = {
			humidityId: measurementHumidity.id,
			temperatureId: measurementTemperature.id,
		};

		await this.deviceRepo.updateById({
			mac: device.mac,
			lastMeasurementId: device.lastMeasurementId,
		});

		await this.measurementRepo.saveMany([
			measurementTemperature,
			measurementHumidity,
		]);

		return {
			message: "Mendições salvas com sucesso",
		};
	}
}
