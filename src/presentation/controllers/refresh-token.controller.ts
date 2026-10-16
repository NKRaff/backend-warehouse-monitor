import type {
	RefreshTokenInputDto,
	RefreshTokenOutputDto,
} from "@application/dtos/refresh-token.dto.js";
import type { IUseCase } from "@application/use-cases/use-case.interface.js";
import type { RequestContext } from "@presentation/types/request-context.js";
import { RefreshTokenSchema } from "@presentation/validators/schemas/refresh-token.schema.js";
import type { IController } from "./controller.interface.js";

export class RefreshTokenController
	implements IController<RefreshTokenOutputDto>
{
	private static _instance: RefreshTokenController;

	private constructor(
		private readonly useCase: IUseCase<
			RefreshTokenInputDto,
			RefreshTokenOutputDto
		>,
	) {}

	static instance(
		useCase: IUseCase<RefreshTokenInputDto, RefreshTokenOutputDto>,
	): RefreshTokenController {
		if (!RefreshTokenController._instance) {
			RefreshTokenController._instance = new RefreshTokenController(useCase);
		}
		return RefreshTokenController._instance;
	}

	async handle(
		input: unknown,
		_context: RequestContext,
	): Promise<RefreshTokenOutputDto> {
		const data = RefreshTokenSchema.parse(input);
		return await this.useCase.execute(data);
	}
}
