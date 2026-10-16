import type {
	ChangePasswordInputDto,
	ChangePasswordOutputDto,
} from "@application/dtos/change-password.dto.js";
import type { IUseCase } from "@application/use-cases/use-case.interface.js";
import type { RequestContext } from "@presentation/types/request-context.js";
import { ChangePasswordSchema } from "@presentation/validators/schemas/change-password.schema.js";
import { UnauthorizedError } from "@shared/errors/unauthorized-error.js";
import type { IController } from "./controller.interface.js";

export class ChangePasswordController
	implements IController<ChangePasswordOutputDto>
{
	private static _instance: ChangePasswordController;

	constructor(
		private readonly useCase: IUseCase<
			ChangePasswordInputDto,
			ChangePasswordOutputDto
		>,
	) {}

	static instance(
		useCase: IUseCase<ChangePasswordInputDto, ChangePasswordOutputDto>,
	): ChangePasswordController {
		if (!ChangePasswordController._instance) {
			ChangePasswordController._instance = new ChangePasswordController(
				useCase,
			);
		}
		return ChangePasswordController._instance;
	}

	async handle(
		input: unknown,
		context: RequestContext,
	): Promise<ChangePasswordOutputDto> {
		if (!context.actorId) {
			throw new UnauthorizedError("Id do usuario não encontrado");
		}
		const data = ChangePasswordSchema.parse(input);
		return await this.useCase.execute(data);
	}
}
