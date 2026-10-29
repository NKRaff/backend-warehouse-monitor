import type {
	GetDeviceInputDto,
	GetDeviceOutputDto,
} from "@application/dtos/get-device.dto.js";
import type { IDeviceRepository } from "@application/repositories/device.interface.js";
import { NotFoundError } from "@shared/errors/not-found-error.js";
import type { IUseCase } from "./use-case.interface.js";

export class GetDeviceUseCase
	implements IUseCase<GetDeviceInputDto, GetDeviceOutputDto>
{
	private static _instance: GetDeviceUseCase;

	private constructor(private deviceRepo: IDeviceRepository) {}

	static instance(warehouseRepo: IDeviceRepository) {
		if (!GetDeviceUseCase._instance) {
			GetDeviceUseCase._instance = new GetDeviceUseCase(warehouseRepo);
		}
		return GetDeviceUseCase._instance;
	}

	async execute(input: GetDeviceInputDto): Promise<GetDeviceOutputDto> {
		const device = await this.deviceRepo.findById(input.deviceMac);

		if (device === null) {
			throw new NotFoundError("Dispositivo não encontrado");
		}

		return {
			message: "Dispositivo encontrado",
			device: {
				deviceStatus: device.deviceStatus,
				mac: device.mac,
				monitoringStatus: device.monitoringStatus,
				name: device.name,
				...(device.lastMeasurementId && {
					lastMeasurementId: device.lastMeasurementId,
				}),
				...(device.warehouseId && { warehouseId: device.warehouseId }),
			},
		};
	}
}
