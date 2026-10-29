import type {
	ListAllDeviceInputDto,
	ListAllDeviceOutputDto,
} from "@application/dtos/list-all-device.dto.js";
import type { IUseCase } from "@application/use-cases/use-case.interface.js";
import type { RequestContext } from "@presentation/types/request-context.js";
import { ListAllDeviceSchema } from "@presentation/validators/schemas/list-all-devices.schema.js";
import type { IController } from "./controller.interface.js";

export class ListAllDeviceController
	implements IController<ListAllDeviceOutputDto>
{
	private static _instance: ListAllDeviceController;

	private constructor(
		private readonly useCase: IUseCase<
			ListAllDeviceInputDto,
			ListAllDeviceOutputDto
		>,
	) {}

	static instance(
		useCase: IUseCase<ListAllDeviceInputDto, ListAllDeviceOutputDto>,
	): ListAllDeviceController {
		if (!ListAllDeviceController._instance) {
			ListAllDeviceController._instance = new ListAllDeviceController(useCase);
		}
		return ListAllDeviceController._instance;
	}

	async handle(
		input: unknown,
		_context: RequestContext,
	): Promise<ListAllDeviceOutputDto> {
		const data = ListAllDeviceSchema.parse(input);
		return await this.useCase.execute(data);
	}
}
