import type {
	GetDeviceInputDto,
	GetDeviceOutputDto,
} from "@application/dtos/get-device.dto.js";
import type { IUseCase } from "@application/use-cases/use-case.interface.js";
import type { RequestContext } from "@presentation/types/request-context.js";
import { GetDeviceSchema } from "@presentation/validators/schemas/get-device.schema.js";
import type { IController } from "./controller.interface.js";

export class GetDeviceController implements IController<GetDeviceOutputDto> {
	private static _instance: GetDeviceController;

	private constructor(
		private readonly useCase: IUseCase<GetDeviceInputDto, GetDeviceOutputDto>,
	) {}

	static instance(
		useCase: IUseCase<GetDeviceInputDto, GetDeviceOutputDto>,
	): GetDeviceController {
		if (!GetDeviceController._instance) {
			GetDeviceController._instance = new GetDeviceController(useCase);
		}
		return GetDeviceController._instance;
	}

	async handle(
		input: unknown,
		_context: RequestContext,
	): Promise<GetDeviceOutputDto> {
		const data = GetDeviceSchema.parse(input);
		return await this.useCase.execute(data);
	}
}
