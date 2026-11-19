import type {
	ChangeEmailNotificationInputDto,
	ChangeEmailNotificationOutputDto,
} from "@application/dtos/change-email-notification.dto.js";
import type { IUserRepository } from "@application/repositories/user.interface.js";
import { NotFoundError } from "@shared/errors/not-found-error.js";
import type { IUseCase } from "./use-case.interface.js";

export class ChangeEmailNotificationUseCase
	implements
		IUseCase<ChangeEmailNotificationInputDto, ChangeEmailNotificationOutputDto>
{
	private static _instance: ChangeEmailNotificationUseCase;

	private constructor(private readonly userRepo: IUserRepository) {}

	static instance(userRepo: IUserRepository): ChangeEmailNotificationUseCase {
		if (!ChangeEmailNotificationUseCase._instance) {
			ChangeEmailNotificationUseCase._instance =
				new ChangeEmailNotificationUseCase(userRepo);
		}
		return ChangeEmailNotificationUseCase._instance;
	}

	async execute(
		input: ChangeEmailNotificationInputDto,
	): Promise<ChangeEmailNotificationOutputDto> {
		const userExist = await this.userRepo.findById(input.userId);

		if (userExist === null) {
			throw new NotFoundError("Usuario não encontrado");
		}

		userExist.email.changeNotification();

		await this.userRepo.updateEmailNotification(
			userExist.id,
			userExist.email.enableNotification,
		);

		return {
			message: `Recebimento de email ${userExist.email.enableNotification ? "Ativado" : "Desativado"}`,
		};
	}
}
