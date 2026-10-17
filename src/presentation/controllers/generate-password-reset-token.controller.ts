import type {
	GeneratePasswordResetTokenInputDto,
	GeneratePasswordResetTokenOutputDto,
} from "@application/dtos/generate-password-reset-token.dto.js";
import type { IUseCase } from "@application/use-cases/use-case.interface.js";
import type { RequestContext } from "@presentation/types/request-context.js";
import { GeneratePasswordResetTokenSchema } from "@presentation/validators/schemas/generate-password-reset-token.schema.js";
import type { IController } from "./controller.interface.js";

export class GeneratePasswordResetTokenController
	implements IController<GeneratePasswordResetTokenOutputDto>
{
	private static _instance: GeneratePasswordResetTokenController;

	private constructor(
		private readonly useCase: IUseCase<
			GeneratePasswordResetTokenInputDto,
			GeneratePasswordResetTokenOutputDto
		>,
	) {}

	static instance(
		useCase: IUseCase<
			GeneratePasswordResetTokenInputDto,
			GeneratePasswordResetTokenOutputDto
		>,
	): GeneratePasswordResetTokenController {
		if (!GeneratePasswordResetTokenController._instance) {
			GeneratePasswordResetTokenController._instance =
				new GeneratePasswordResetTokenController(useCase);
		}
		return GeneratePasswordResetTokenController._instance;
	}

	async handle(
		input: unknown,
		_context: RequestContext,
	): Promise<GeneratePasswordResetTokenOutputDto> {
		const data = GeneratePasswordResetTokenSchema.parse(input);
		return await this.useCase.execute(data);
	}
}
