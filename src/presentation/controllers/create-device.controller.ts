import type {
	CreateDeviceInputDto,
	CreateDeviceOutputDto,
} from "@application/dtos/create-device.dto.js";
import type { IUseCase } from "@application/use-cases/use-case.interface.js";
import type { RequestContext } from "@presentation/types/request-context.js";
import { CreateDeviceSchema } from "@presentation/validators/schemas/create-device.schema.js";
import { UnauthorizedError } from "@shared/errors/unauthorized-error.js";
import type { IController } from "./controller.interface.js";

export class CreateDeviceController
	implements IController<CreateDeviceOutputDto>
{
	private static _instance: CreateDeviceController;

	private constructor(
		private readonly useCase: IUseCase<
			CreateDeviceInputDto,
			CreateDeviceOutputDto
		>,
	) {}

	static instance(
		useCase: IUseCase<CreateDeviceInputDto, CreateDeviceOutputDto>,
	): CreateDeviceController {
		if (!CreateDeviceController._instance) {
			CreateDeviceController._instance = new CreateDeviceController(useCase);
		}
		return CreateDeviceController._instance;
	}

	async handle(
		input: unknown,
		context: RequestContext,
	): Promise<CreateDeviceOutputDto> {
		if (!context.actorId) {
			throw new UnauthorizedError("Id do usuario não encontrado");
		}

		const data = CreateDeviceSchema.parse(input);
		return await this.useCase.execute({
			actorId: context.actorId,
			device: data,
		});
	}
}
