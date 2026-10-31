import type {
	UpdateDeviceInputDto,
	UpdateDeviceOutputDto,
} from "@application/dtos/update-device.dto.js";
import type { IMqttClient } from "@application/ports/mqtt-client.interface.js";
import type { IDeviceRepository } from "@application/repositories/device.interface.js";
import { MonitoringStatus } from "@domain/types/monitoring-status.js";
import { NotFoundError } from "@shared/errors/not-found-error.js";
import type { IUseCase } from "./use-case.interface.js";

export class UpdateDeviceUseCase
	implements IUseCase<UpdateDeviceInputDto, UpdateDeviceOutputDto>
{
	private static _instance: UpdateDeviceUseCase;

	private constructor(
		private readonly deviceRepo: IDeviceRepository,
		private readonly mqttClient: IMqttClient,
	) {}

	static instance(
		userRepo: IDeviceRepository,
		mqttClient: IMqttClient,
	): UpdateDeviceUseCase {
		if (!UpdateDeviceUseCase._instance) {
			UpdateDeviceUseCase._instance = new UpdateDeviceUseCase(
				userRepo,
				mqttClient,
			);
		}
		return UpdateDeviceUseCase._instance;
	}

	async execute(input: UpdateDeviceInputDto): Promise<UpdateDeviceOutputDto> {
		const deviceExist = await this.deviceRepo.findById(input.device.mac);

		if (deviceExist === null) {
			throw new NotFoundError("Dispositivo não encontrado");
		}

		if (
			deviceExist.monitoringStatus === MonitoringStatus.DISABLE &&
			input.device.monitoringStatus === MonitoringStatus.ENABLE
		) {
			await this.mqttClient.subscribe(`device/${deviceExist.mac}/telemetry`);
			await this.mqttClient.subscribe(`device/${deviceExist.mac}/error`);
		}

		if (
			deviceExist.monitoringStatus === MonitoringStatus.ENABLE &&
			input.device.monitoringStatus === MonitoringStatus.DISABLE
		) {
			await this.mqttClient.unsubscribe(`device/${deviceExist.mac}/telemetry`);
			await this.mqttClient.unsubscribe(`device/${deviceExist.mac}/error`);
		}

		await this.deviceRepo.updateById({
			mac: deviceExist.mac,
			...(input.device.deviceStatus && {
				deviceStatus: input.device.deviceStatus,
			}),
			...(input.device.monitoringStatus && {
				monitoringStatus: input.device.monitoringStatus,
			}),
			...(input.device.name && { name: input.device.name }),
			...(input.device.warehouseId && {
				warehouseId: input.device.warehouseId,
			}),
		});

		return {
			message: "Dispositivo atualizado com sucesso",
			device: {
				mac: deviceExist.mac,
				deviceStatus: input.device.deviceStatus ?? deviceExist.deviceStatus,
				monitoringStatus:
					input.device.monitoringStatus ?? deviceExist.monitoringStatus,
				name: input.device.name ?? deviceExist.name,
				warehouseId: input.device.warehouseId ?? deviceExist.warehouseId,
				...(deviceExist.lastMeasurementId && {
					lastMeasurementId: deviceExist.lastMeasurementId,
				}),
			},
		};
	}
}
