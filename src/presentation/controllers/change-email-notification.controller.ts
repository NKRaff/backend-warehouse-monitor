import type {
	ChangeEmailNotificationInputDto,
	ChangeEmailNotificationOutputDto,
} from "@application/dtos/change-email-notification.dto.js";
import type { IUseCase } from "@application/use-cases/use-case.interface.js";
import type { RequestContext } from "@presentation/types/request-context.js";
import { UnauthorizedError } from "@shared/errors/unauthorized-error.js";
import type { IController } from "./controller.interface.js";

export class ChangeEmailNotificationController
	implements IController<ChangeEmailNotificationOutputDto>
{
	private static _instance: ChangeEmailNotificationController;

	private constructor(
		private readonly useCase: IUseCase<
			ChangeEmailNotificationInputDto,
			ChangeEmailNotificationOutputDto
		>,
	) {}

	static instance(
		useCase: IUseCase<
			ChangeEmailNotificationInputDto,
			ChangeEmailNotificationOutputDto
		>,
	): ChangeEmailNotificationController {
		if (!ChangeEmailNotificationController._instance) {
			ChangeEmailNotificationController._instance =
				new ChangeEmailNotificationController(useCase);
		}
		return ChangeEmailNotificationController._instance;
	}

	async handle(
		_input: unknown,
		context: RequestContext,
	): Promise<ChangeEmailNotificationOutputDto> {
		if (!context.actorId) {
			throw new UnauthorizedError("Id do autor não encontrado");
		}

		return await this.useCase.execute({
			userId: context.actorId,
		});
	}
}
