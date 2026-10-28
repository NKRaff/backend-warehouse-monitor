import type {
	UpdateDeviceInputDto,
	UpdateDeviceOutputDto,
} from "@application/dtos/update-device.dto.js";
import type { IUseCase } from "@application/use-cases/use-case.interface.js";
import type { RequestContext } from "@presentation/types/request-context.js";
import { UpdateDeviceSchema } from "@presentation/validators/schemas/update-device.schema.js";
import { UnauthorizedError } from "@shared/errors/unauthorized-error.js";
import type { IController } from "./controller.interface.js";

export class UpdateDeviceController
	implements IController<UpdateDeviceOutputDto>
{
	private static _instance: UpdateDeviceController;

	private constructor(
		private readonly useCase: IUseCase<
			UpdateDeviceInputDto,
			UpdateDeviceOutputDto
		>,
	) {}

	static instance(
		useCase: IUseCase<UpdateDeviceInputDto, UpdateDeviceOutputDto>,
	): UpdateDeviceController {
		if (!UpdateDeviceController._instance) {
			UpdateDeviceController._instance = new UpdateDeviceController(useCase);
		}
		return UpdateDeviceController._instance;
	}

	async handle(
		input: unknown,
		context: RequestContext,
	): Promise<UpdateDeviceOutputDto> {
		if (!context.actorId) {
			throw new UnauthorizedError("Id do usuario não encontrado");
		}

		const data = UpdateDeviceSchema.parse(input);
		return await this.useCase.execute({
			actorId: context.actorId,
			device: data,
		});
	}
}
