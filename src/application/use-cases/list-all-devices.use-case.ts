import type {
	ListAllDeviceInputDto,
	ListAllDeviceOutputDto,
} from "@application/dtos/list-all-device.dto.js";
import type { IDeviceRepository } from "@application/repositories/device.interface.js";
import type { IUseCase } from "./use-case.interface.js";

export class ListAllDeviceUseCase
	implements IUseCase<ListAllDeviceInputDto, ListAllDeviceOutputDto>
{
	private static _instance: ListAllDeviceUseCase;

	private constructor(private deviceRepo: IDeviceRepository) {}

	static instance(deviceRepo: IDeviceRepository) {
		if (!ListAllDeviceUseCase._instance) {
			ListAllDeviceUseCase._instance = new ListAllDeviceUseCase(deviceRepo);
		}
		return ListAllDeviceUseCase._instance;
	}

	async execute(input: ListAllDeviceInputDto): Promise<ListAllDeviceOutputDto> {
		const devices = await this.deviceRepo.findAll(input.offSet, input.limit);

		return {
			message: "List de Armazéns encontrado",
			devices,
		};
	}
}
