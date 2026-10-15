import crypto from "node:crypto";
import type {
	RegisterUserInputDto,
	RegisterUserOutputDto,
} from "@application/dtos/register-user.dto.js";
import type { IPasswordHasher } from "@application/ports/password-hasher.interface.js";
import type { IUuidProvider } from "@application/ports/uuid-provider.interface.js";
import type { IAlertRepository } from "@application/repositories/alert.interface.js";
import type { IAuditLogRepository } from "@application/repositories/audit-log.interface.js";
import type { INotificationRepository } from "@application/repositories/notification.interface.js";
import type { IUserRepository } from "@application/repositories/user.interface.js";
import type { NotificationService } from "@application/services/notification.service.js";
import type { IUseCase } from "@application/use-cases/use-case.interface.js";
import { Alert } from "@domain/entities/alert.js";
import { AuditLog } from "@domain/entities/audit-log.js";
import { Notification } from "@domain/entities/notification.js";
import { User } from "@domain/entities/user.js";
import { Email } from "@domain/object-values/email.js";
import { ConflictError } from "@shared/errors/conflict-error.js";

export class RegisterUserUseCase
	implements IUseCase<RegisterUserInputDto, RegisterUserOutputDto>
{
	private static _instance: RegisterUserUseCase;

	private constructor(
		private uuidProvider: IUuidProvider,
		private passwordHasher: IPasswordHasher,
		private userRepo: IUserRepository,
		private alertRepo: IAlertRepository,
		private notificationRepo: INotificationRepository,
		private auditLogRepo: IAuditLogRepository,
		private notificationService: NotificationService,
	) {}

	static instance(
		uuidProvider: IUuidProvider,
		passwordHasher: IPasswordHasher,
		userRepo: IUserRepository,
		alertRepo: IAlertRepository,
		notificationRepo: INotificationRepository,
		auditLogRepo: IAuditLogRepository,
		notificationService: NotificationService,
	) {
		if (!RegisterUserUseCase._instance) {
			RegisterUserUseCase._instance = new RegisterUserUseCase(
				uuidProvider,
				passwordHasher,
				userRepo,
				alertRepo,
				notificationRepo,
				auditLogRepo,
				notificationService,
			);
		}
		return RegisterUserUseCase._instance;
	}

	async execute(input: RegisterUserInputDto): Promise<RegisterUserOutputDto> {
		input.email = input.email.toLowerCase().trim();
		const randomPassword = crypto.randomBytes(8).toString();
		const dateNow = new Date();

		const userExists = await this.userRepo.findByEmail(input.email);

		if (userExists !== null) {
			throw new ConflictError("Email já cadastrado");
		}

		const user = User.create({
			id: this.uuidProvider.generate(),
			name: input.name,
			email: new Email(input.email),
			passwordHashed: await this.passwordHasher.hash(randomPassword),
			role: input.role,
		});

		await this.userRepo.save(user);

		const alert = Alert.create({
			id: this.uuidProvider.generate(),
			type: "register_user",
			severity: "info",
			title: "Acesso ao sistema disponibilizado",
			description: `Sua conta foi criada por um administrador. Você já pode acessar o sistema utilizando as seguintes credenciais:\n\nUsuário: ${user.email.value}\nSenha temporária: ${randomPassword}\n\nPor segurança, altere sua senha no primeiro acesso. Em caso de dúvidas, entre em contato com o administrador do sistema.`,
			occurredAt: dateNow,
		});

		const notification = Notification.create({
			id: this.uuidProvider.generate(),
			alertId: alert.id,
			recipientId: user.id,
			channels: ["email"],
			createdAt: dateNow,
		});

		await this.alertRepo.save(alert);
		await this.notificationRepo.save(notification);

		this.notificationService
			.notify({
				recipient: user,
				title: alert.title,
				message: alert.description,
				type: alert.type,
				severity: alert.severity,
				status: alert.status,
				channels: notification.channels,
			})
			.catch((error) => {
				console.error(
					`Falha no envio de e-mail para o usuário ID: ${user.id}`,
					{
						notificationId: notification.id,
						error: error.message,
					},
				);
			});

		const log = AuditLog.create({
			id: this.uuidProvider.generate(),
			actorId: input.actorId,
			action: "create",
			resourceId: user.id,
			resourceType: "user",
			createdAt: dateNow,
		});

		await this.auditLogRepo.save(log);

		return {
			message: "Usuario cadastrado com sucesso",
			user: {
				id: user.id,
				name: user.name,
				email: {
					value: user.email.value,
					isVerified: user.email.isVerified,
				},
				role: user.role,
			},
		};
	}
}
