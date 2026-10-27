import type {
	CreateDeviceInputDto,
	CreateDeviceOutputDto,
} from "@application/dtos/create-device.dto.js";
import type { IDeviceRepository } from "@application/repositories/device.interface.js";
import { Device } from "@domain/entities/device.js";
import { ConflictError } from "@shared/errors/conflict-error.js";
import type { IUseCase } from "./use-case.interface.js";

export class CreateDeviceUseCase
	implements IUseCase<CreateDeviceInputDto, CreateDeviceOutputDto>
{
	private static _instance: CreateDeviceUseCase;

	private constructor(private readonly deviceRepo: IDeviceRepository) {}

	static instance(deviceRepo: IDeviceRepository): CreateDeviceUseCase {
		if (!CreateDeviceUseCase._instance) {
			CreateDeviceUseCase._instance = new CreateDeviceUseCase(deviceRepo);
		}
		return CreateDeviceUseCase._instance;
	}

	async execute(input: CreateDeviceInputDto): Promise<CreateDeviceOutputDto> {
		const deviceExist = await this.deviceRepo.findById(input.device.mac);

		if (deviceExist === null) {
			throw new ConflictError("Dispositivo ja cadastrado");
		}

		const device = Device.create({
			mac: input.device.mac,
			name: input.device.name,
			warehouseId: input.device.warehouseId,
		});

		await this.deviceRepo.save(device);

		return {
			message: "Dispositivo cadastrato com sucesso",
			device: {
				deviceStatus: device.deviceStatus,
				mac: device.mac,
				monitoringStatus: device.monitoringStatus,
				name: device.name,
			},
		};
	}
}
