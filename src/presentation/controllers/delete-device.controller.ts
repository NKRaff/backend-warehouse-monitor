import type {
	DeleteDeviceInputDto,
	DeleteDeviceOutputDto,
} from "@application/dtos/delete-device.dto.js";
import type { IUseCase } from "@application/use-cases/use-case.interface.js";
import type { RequestContext } from "@presentation/types/request-context.js";
import { DeleteDeviceSchema } from "@presentation/validators/schemas/delete-device.schema.js";
import { UnauthorizedError } from "@shared/errors/unauthorized-error.js";
import type { IController } from "./controller.interface.js";

export class DeleteDeviceController
	implements IController<DeleteDeviceOutputDto>
{
	private static _instance: DeleteDeviceController;

	private constructor(
		private readonly useCase: IUseCase<
			DeleteDeviceInputDto,
			DeleteDeviceOutputDto
		>,
	) {}

	static instance(
		useCase: IUseCase<DeleteDeviceInputDto, DeleteDeviceOutputDto>,
	): DeleteDeviceController {
		if (!DeleteDeviceController._instance) {
			DeleteDeviceController._instance = new DeleteDeviceController(useCase);
		}
		return DeleteDeviceController._instance;
	}

	async handle(
		input: unknown,
		context: RequestContext,
	): Promise<DeleteDeviceOutputDto> {
		if (!context.actorId) {
			throw new UnauthorizedError("Id do autor não encontrado");
		}

		const data: DeleteDeviceInputDto = {
			...DeleteDeviceSchema.parse(input),
			actorId: context.actorId,
		};

		return await this.useCase.execute(data);
	}
}
