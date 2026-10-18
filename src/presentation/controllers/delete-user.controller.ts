import type {
	DeleteUserInputDto,
	DeleteUserOutputDto,
} from "@application/dtos/delete-user.dto.js";
import type { IUseCase } from "@application/use-cases/use-case.interface.js";
import type { RequestContext } from "@presentation/types/request-context.js";
import { DeleteUserSchema } from "@presentation/validators/schemas/delete-user.schema.js";
import { UnauthorizedError } from "@shared/errors/unauthorized-error.js";
import type { IController } from "./controller.interface.js";

export class DeleteUserController implements IController<DeleteUserOutputDto> {
	private static _instance: DeleteUserController;

	private constructor(
		private readonly useCase: IUseCase<DeleteUserInputDto, DeleteUserOutputDto>,
	) {}

	static instance(
		useCase: IUseCase<DeleteUserInputDto, DeleteUserOutputDto>,
	): DeleteUserController {
		if (!DeleteUserController._instance) {
			DeleteUserController._instance = new DeleteUserController(useCase);
		}
		return DeleteUserController._instance;
	}

	async handle(
		input: unknown,
		context: RequestContext,
	): Promise<DeleteUserOutputDto> {
		if (!context.actorId) {
			throw new UnauthorizedError("Id do autor não encontrado");
		}

		const data: DeleteUserInputDto = {
			...DeleteUserSchema.parse(input),
			actorId: context.actorId,
		};

		return await this.useCase.execute(data);
	}
}
