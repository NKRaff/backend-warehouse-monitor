import type {
	LoginInputDto,
	LoginOutputDto,
} from "@application/dtos/login.dto.js";
import type { IUseCase } from "@application/use-cases/use-case.interface.js";
import type { RequestContext } from "@presentation/types/request-context.js";
import { LoginSchema } from "@presentation/validators/schemas/login.schema.js";
import type { IController } from "./controller.interface.js";

export class LoginController implements IController<LoginOutputDto> {
	private static _instance: LoginController;

	private constructor(
		private readonly useCase: IUseCase<LoginInputDto, LoginOutputDto>,
	) {}

	static instance(
		useCase: IUseCase<LoginInputDto, LoginOutputDto>,
	): LoginController {
		if (!LoginController._instance) {
			LoginController._instance = new LoginController(useCase);
		}
		return LoginController._instance;
	}

	async handle(
		input: unknown,
		_context: RequestContext,
	): Promise<LoginOutputDto> {
		const data = LoginSchema.parse(input);
		return await this.useCase.execute(data);
	}
}
