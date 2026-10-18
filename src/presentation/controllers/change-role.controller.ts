import type {
	ChangeRoleInputDto,
	ChangeRoleOutputDto,
} from "@application/dtos/change-role-user.dto.js";
import type { IUseCase } from "@application/use-cases/use-case.interface.js";
import type { RequestContext } from "@presentation/types/request-context.js";
import { ChangeRoleSchema } from "@presentation/validators/schemas/change-role.schema.js";
import { UnauthorizedError } from "@shared/errors/unauthorized-error.js";
import type { IController } from "./controller.interface.js";

export class ChangeRoleController implements IController<ChangeRoleOutputDto> {
	private static _instance: ChangeRoleController;

	private constructor(
		private readonly useCase: IUseCase<ChangeRoleInputDto, ChangeRoleOutputDto>,
	) {}

	static instance(
		useCase: IUseCase<ChangeRoleInputDto, ChangeRoleOutputDto>,
	): ChangeRoleController {
		if (!ChangeRoleController._instance) {
			ChangeRoleController._instance = new ChangeRoleController(useCase);
		}
		return ChangeRoleController._instance;
	}

	async handle(
		input: unknown,
		context: RequestContext,
	): Promise<ChangeRoleOutputDto> {
		if (!context.actorId) {
			throw new UnauthorizedError("Id do autor não encontrado");
		}

		const data: ChangeRoleInputDto = {
			...ChangeRoleSchema.parse(input),
			actorId: context.actorId,
		};

		return await this.useCase.execute(data);
	}
}
