import type {
	UpdateUserInputDto,
	UpdateUserOutputDto,
} from "@application/dtos/update-user.dto.js";
import type { IUseCase } from "@application/use-cases/use-case.interface.js";
import type { RequestContext } from "@presentation/types/request-context.js";
import { UpdateUserSchema } from "@presentation/validators/schemas/update-user.schema.js";
import type { IController } from "./controller.interface.js";

export class UpdateUserController implements IController<UpdateUserOutputDto> {
	private static _instance: UpdateUserController;

	private constructor(
		private readonly useCase: IUseCase<UpdateUserInputDto, UpdateUserOutputDto>,
	) {}

	static instance(
		useCase: IUseCase<UpdateUserInputDto, UpdateUserOutputDto>,
	): UpdateUserController {
		if (!UpdateUserController._instance) {
			UpdateUserController._instance = new UpdateUserController(useCase);
		}
		return UpdateUserController._instance;
	}

	async handle(
		input: unknown,
		_context: RequestContext,
	): Promise<UpdateUserOutputDto> {
		const data: UpdateUserInputDto = UpdateUserSchema.parse(input);
		return await this.useCase.execute(data);
	}
}
