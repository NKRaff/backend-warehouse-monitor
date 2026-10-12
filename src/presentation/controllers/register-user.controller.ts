import type {
	RegisterUserInputDto,
	RegisterUserOutputDto,
} from "@application/dtos/register-user.dto.js";
import type { IUseCase } from "@application/use-cases/use-case.interface.js";
import type { RequestContext } from "@presentation/types/request-context.js";
import { RegisterUserSchema } from "../validators/schemas/register-user.schema.js";
import type { IController } from "./controller.interface.js";

export class RegisterUserController
	implements IController<RegisterUserOutputDto>
{
	private static _instance: RegisterUserController;

	private constructor(
		private readonly useCase: IUseCase<
			RegisterUserInputDto,
			RegisterUserOutputDto
		>,
	) {}

	static instance(
		useCase: IUseCase<RegisterUserInputDto, RegisterUserOutputDto>,
	): RegisterUserController {
		if (!RegisterUserController._instance) {
			RegisterUserController._instance = new RegisterUserController(useCase);
		}
		return RegisterUserController._instance;
	}

	async handle(
		input: unknown,
		context: RequestContext,
	): Promise<RegisterUserOutputDto> {
		const data = RegisterUserSchema.parse(input);
		return await this.useCase.execute({
			...data,
			actorId: context.actorId,
		});
	}
}
