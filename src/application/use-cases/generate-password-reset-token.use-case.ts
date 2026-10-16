import type {
	GeneratePasswordResetTokenInputDto,
	GeneratePasswordResetTokenOutputDto,
} from "@application/dtos/generate-password-reset-token.dto.js";
import type { IUuidProvider } from "@application/ports/uuid-provider.interface.js";
import type { IAlertRepository } from "@application/repositories/alert.interface.js";
import type { INotificationRepository } from "@application/repositories/notification.interface.js";
import type { ITokenRepository } from "@application/repositories/token.interface.js";
import type { IUserRepository } from "@application/repositories/user.interface.js";
import type { NotificationService } from "@application/services/notification.service.js";
import { Alert } from "@domain/entities/alert.js";
import { Notification } from "@domain/entities/notification.js";
import { Token } from "@domain/entities/token.js";
import { NotFoundError } from "@shared/errors/not-found-error.js";
import type { IUseCase } from "./use-case.interface.js";

export class GeneratePasswordResetTokenUseCase
	implements
		IUseCase<
			GeneratePasswordResetTokenInputDto,
			GeneratePasswordResetTokenOutputDto
		>
{
	private static _instance: GeneratePasswordResetTokenUseCase;

	private constructor(
		private uuidProvider: IUuidProvider,
		private userRepo: IUserRepository,
		private alertRepo: IAlertRepository,
		private notificationRepo: INotificationRepository,
		private tokenRepo: ITokenRepository,
		private notificationService: NotificationService,
	) {}

	static instance(
		uuidProvider: IUuidProvider,
		userRepo: IUserRepository,
		alertRepo: IAlertRepository,
		notificationRepo: INotificationRepository,
		tokenRepo: ITokenRepository,
		notificationService: NotificationService,
	) {
		if (!GeneratePasswordResetTokenUseCase._instance) {
			GeneratePasswordResetTokenUseCase._instance =
				new GeneratePasswordResetTokenUseCase(
					uuidProvider,
					userRepo,
					alertRepo,
					notificationRepo,
					tokenRepo,
					notificationService,
				);
		}
		return GeneratePasswordResetTokenUseCase._instance;
	}

	async execute(
		input: GeneratePasswordResetTokenInputDto,
	): Promise<GeneratePasswordResetTokenOutputDto> {
		input.email = input.email.toLowerCase().trim();
		const user = await this.userRepo.findByEmail(input.email);

		if (user === null) {
			throw new NotFoundError("Nenhum usuario associado a esse email");
		}

		const dateNow = new Date();

		const alert = Alert.create({
			id: this.uuidProvider.generate(),
			title: "Link para recuperar o acesso à sua conta",
			description:
				"Foi solicitado um link para recuperar o acesso à sua conta. " +
				"Utilize o link enviado para o seu e-mail em até 15 minutos. " +
				"Os links anteriores deixam de ser válidos.",
			type: "password_reset",
			occurredAt: dateNow,
			severity: "info",
		});

		const notification = Notification.create({
			id: this.uuidProvider.generate(),
			alertId: alert.id,
			recipientId: user.id,
			createdAt: dateNow,
			channels: ["email"],
		});

		const tokenExist = await this.tokenRepo.findByUserAndType(
			user.id,
			"password_reset",
		);

		let resetPasswordToken: string;

		if (tokenExist === null) {
			const token = Token.createPasswordReset(
				this.uuidProvider.generate(),
				user.id,
			);

			resetPasswordToken = token.value;
			token.value = token.hash();

			await this.tokenRepo.save(token);
		} else {
			tokenExist.refresh();

			resetPasswordToken = tokenExist.value;
			tokenExist.value = tokenExist.hash();

			await this.tokenRepo.updateToken(
				tokenExist.id,
				tokenExist.value,
				tokenExist.expiresAt,
			);
		}

		await this.alertRepo.save(alert);
		await this.notificationRepo.save(notification);

		this.notificationService.notify({
			recipient: user,
			title: alert.title,
			message: alert.description,
			type: "password_reset",
			severity: "info",
			status: "active",
			channels: ["email"],
			metadata: {
				token: resetPasswordToken,
			},
		});

		return {
			message: "Token de redefinição de senha enviado por email",
		};
	}
}
