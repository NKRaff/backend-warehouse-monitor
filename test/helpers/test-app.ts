import type { SmtpClient } from "@application/ports/smtp-client.interface.js";
import { AuthorizationPolicy } from "@application/services/authorization-policy.js";
import { NotificationService } from "@application/services/notification.service.js";
import { PasswordPolicyService } from "@application/services/password-policy.service.js";
import { ChangePasswordUseCase } from "@application/use-cases/change-password.use-case.js";
import { ChangeRoleUseCase } from "@application/use-cases/change-role.use-case.js";
import { DeleteUserUseCase } from "@application/use-cases/delete-user.use-case.js";
import { GeneratePasswordResetTokenUseCase } from "@application/use-cases/generate-password-reset-token.use-case.js";
import { LoginUseCase } from "@application/use-cases/login.use-case.js";
import { RefreshTokenUseCase } from "@application/use-cases/refresh-token.use-case.js";
import { RegisterUserUseCase } from "@application/use-cases/register-user.use-case.js";
import { UpdateUserUseCase } from "@application/use-cases/update-user-use-case.js";
import { BcryptPasswordHasherAdapter } from "@infrastructure/cryptography/bcrypt-password-hasher.adapter.js";
import { JwtTokenAdapter } from "@infrastructure/cryptography/jwt-token.adapter.js";
import { AlertRepository } from "@infrastructure/database/mongodb/repositories/alert.repository.js";
import { AuditLogRepository } from "@infrastructure/database/mongodb/repositories/audit-log.repository.js";
import { NotificationRepository } from "@infrastructure/database/mongodb/repositories/notification.repository.js";
import { TokenRepository } from "@infrastructure/database/mongodb/repositories/token.repository.js";
import { UserRepository } from "@infrastructure/database/mongodb/repositories/user.repository.js";
import { ExpressApp } from "@infrastructure/http/express/express.app.js";
import { createUserRoutes } from "@infrastructure/http/express/routes/user.routes.js";
import { UuidAdapter } from "@infrastructure/identifier/uuid.adapter.js";
import { EmailNotificationChannel } from "@infrastructure/notification/email/email-channel.js";
import { ChangePasswordController } from "@presentation/controllers/change-password.controller.js";
import { ChangeRoleController } from "@presentation/controllers/change-role.controller.js";
import { DeleteUserController } from "@presentation/controllers/delete-user.controller.js";
import { GeneratePasswordResetTokenController } from "@presentation/controllers/generate-password-reset-token.controller.js";
import { LoginController } from "@presentation/controllers/login.controller.js";
import { RefreshTokenController } from "@presentation/controllers/refresh-token.controller.js";
import { RegisterUserController } from "@presentation/controllers/register-user.controller.js";
import { UpdateUserController } from "@presentation/controllers/update-user.controller.js";
import { Router } from "express";
import { resetSingleton } from "./singleton.js";

/**
 * Composition root de teste que espelha `src/main.ts`, sem MQTT, Socket.IO,
 * `listen()` ou SMTP real. O SMTP é injetado para inspecionar os e-mails.
 */
export function createTestApp(smtp: SmtpClient) {
	resetSingleton(
		UserRepository,
		AlertRepository,
		NotificationRepository,
		AuditLogRepository,
		TokenRepository,
		BcryptPasswordHasherAdapter,
		JwtTokenAdapter,
		UuidAdapter,
		EmailNotificationChannel,
		PasswordPolicyService,
		NotificationService,
		AuthorizationPolicy,
		RegisterUserUseCase,
		LoginUseCase,
		ChangePasswordUseCase,
		RefreshTokenUseCase,
		GeneratePasswordResetTokenUseCase,
		RegisterUserController,
		LoginController,
		ChangePasswordController,
		RefreshTokenController,
		GeneratePasswordResetTokenController,
	);

	const userRepo = UserRepository.instance();
	const alertRepo = AlertRepository.instance();
	const notificationRepo = NotificationRepository.instance();
	const auditLogRepo = AuditLogRepository.instance();
	const tokenRepo = TokenRepository.instance();

	const passwordHasher = BcryptPasswordHasherAdapter.instance();
	const tokenProvider = JwtTokenAdapter.instance();
	const uuidProvider = UuidAdapter.instance();

	const emailChannel = EmailNotificationChannel.instance(smtp);
	const passwordPolicyService = PasswordPolicyService.instance();
	const notificationService = NotificationService.instance([emailChannel]);
	const authorizationPolicy = AuthorizationPolicy.instance(userRepo);

	const registerUserUseCase = RegisterUserUseCase.instance(
		uuidProvider,
		passwordHasher,
		userRepo,
		alertRepo,
		notificationRepo,
		auditLogRepo,
		tokenRepo,
		notificationService,
	);
	const loginUseCase = LoginUseCase.instance(
		passwordHasher,
		tokenProvider,
		uuidProvider,
		userRepo,
		auditLogRepo,
		tokenRepo,
	);
	const changePasswordUseCase = ChangePasswordUseCase.instance(
		passwordHasher,
		uuidProvider,
		userRepo,
		auditLogRepo,
		tokenRepo,
		passwordPolicyService,
	);
	const refreshTokenUseCase = RefreshTokenUseCase.instance(
		tokenProvider,
		tokenRepo,
	);
	const generatePasswordResetTokenUseCase =
		GeneratePasswordResetTokenUseCase.instance(
			uuidProvider,
			userRepo,
			alertRepo,
			notificationRepo,
			tokenRepo,
			notificationService,
		);
	const updateUserUseCase = UpdateUserUseCase.instance(
		uuidProvider,
		userRepo,
		auditLogRepo,
	);
	const changeRoleUseCase = ChangeRoleUseCase.instance(
		uuidProvider,
		userRepo,
		auditLogRepo,
	);
	const deleteUserUseCase = DeleteUserUseCase.instance(
		uuidProvider,
		userRepo,
		auditLogRepo,
		tokenRepo,
	);

	const registerUserController =
		RegisterUserController.instance(registerUserUseCase);
	const loginController = LoginController.instance(loginUseCase);
	const changePasswordController = ChangePasswordController.instance(
		changePasswordUseCase,
	);
	const refreshTokenController =
		RefreshTokenController.instance(refreshTokenUseCase);
	const generatePasswordResetTokenController =
		GeneratePasswordResetTokenController.instance(
			generatePasswordResetTokenUseCase,
		);
	const updateUserController = UpdateUserController.instance(updateUserUseCase);
	const deleteUserController = DeleteUserController.instance(deleteUserUseCase);
	const changeRoleController = ChangeRoleController.instance(changeRoleUseCase);

	const routes = Router();
	routes.use(
		"/user",
		createUserRoutes(
			tokenProvider,
			authorizationPolicy,
			registerUserController,
			loginController,
			changePasswordController,
			refreshTokenController,
			generatePasswordResetTokenController,
			updateUserController,
			changeRoleController,
			deleteUserController,
		),
	);

	return {
		app: ExpressApp.instance(routes),
		passwordHasher,
		tokenProvider,
	};
}
