import type { SmtpClient } from "@application/ports/smtp-client.interface.js";
import { AuthorizationPolicy } from "@application/services/authorization-policy.js";
import { NotificationService } from "@application/services/notification.service.js";
import { PasswordPolicyService } from "@application/services/password-policy.service.js";
import { BootstrapAdminUseCase } from "@application/use-cases/bootstrap-admin.use-case.js";
import { ChangePasswordUseCase } from "@application/use-cases/change-password.use-case.js";
import { LoginUseCase } from "@application/use-cases/login.use-case.js";
import { RegisterUserUseCase } from "@application/use-cases/register-user.use-case.js";
import { ChangePasswordController } from "@presentation/controllers/change-password.controller.js";
import { LoginController } from "@presentation/controllers/login.controller.js";
import { RegisterUserController } from "@presentation/controllers/register-user.controller.js";
import { Router } from "express";
import { BcryptPasswordHasherAdapter } from "@infrastructure/cryptography/bcrypt-password-hasher.adapter.js";
import { JwtTokenAdapter } from "@infrastructure/cryptography/jwt-token.adapter.js";
import { AlertRepository } from "@infrastructure/database/mongodb/repositories/alert.repository.js";
import { AuditLogRepository } from "@infrastructure/database/mongodb/repositories/audit-log.repository.js";
import { NotificationRepository } from "@infrastructure/database/mongodb/repositories/notification.repository.js";
import { UserRepository } from "@infrastructure/database/mongodb/repositories/user.repository.js";
import { ExpressApp } from "@infrastructure/http/express/express.app.js";
import { createUserRoutes } from "@infrastructure/http/express/routes/user.routes.js";
import { UuidAdapter } from "@infrastructure/identifier/uuid.adapter.js";
import { EmailChannel } from "@infrastructure/notification/email-channel.js";
import { resetSingleton } from "./singleton.js";

/**
 * Composition root de teste: espelha `src/main.ts` (mesma ordem de
 * dependências), mas sem MQTT, Socket.IO, `listen()` ou SMTP real. O SMTP é
 * injetado para os testes poderem inspecionar os e-mails enviados.
 *
 * Mantenha este arquivo em sincronia com `main.ts` ao registrar novas rotas.
 */
export function createTestApp(smtp: SmtpClient) {
	resetSingleton(
		UserRepository,
		AlertRepository,
		NotificationRepository,
		AuditLogRepository,
		BcryptPasswordHasherAdapter,
		JwtTokenAdapter,
		UuidAdapter,
		EmailChannel,
		PasswordPolicyService,
		NotificationService,
		AuthorizationPolicy,
		RegisterUserUseCase,
		BootstrapAdminUseCase,
		LoginUseCase,
		ChangePasswordUseCase,
		RegisterUserController,
		LoginController,
		ChangePasswordController,
	);

	// Repositories
	const userRepo = UserRepository.instance();
	const alertRepo = AlertRepository.instance();
	const notificationRepo = NotificationRepository.instance();
	const auditLogRepo = AuditLogRepository.instance();

	// Adapters
	const passwordHasher = BcryptPasswordHasherAdapter.instance();
	const tokenProvider = JwtTokenAdapter.instance();
	const uuidProvider = UuidAdapter.instance();

	// Notification
	const emailChannel = EmailChannel.instance(smtp);

	// Services
	const passwordPolicyService = PasswordPolicyService.instance();
	const notificationService = NotificationService.instance([emailChannel]);
	const authorizationPolicy = AuthorizationPolicy.instance(userRepo);

	// Use cases
	const registerUserUseCase = RegisterUserUseCase.instance(
		uuidProvider,
		passwordHasher,
		userRepo,
		alertRepo,
		notificationRepo,
		auditLogRepo,
		notificationService,
	);
	const bootstrapAdminUseCase = BootstrapAdminUseCase.instance(
		uuidProvider,
		passwordHasher,
		userRepo,
		alertRepo,
		notificationRepo,
		auditLogRepo,
		notificationService,
	);
	const loginUseCase = LoginUseCase.instance(
		passwordHasher,
		tokenProvider,
		uuidProvider,
		userRepo,
		auditLogRepo,
	);
	const changePasswordUseCase = ChangePasswordUseCase.instance(
		passwordHasher,
		uuidProvider,
		userRepo,
		auditLogRepo,
		passwordPolicyService,
	);

	// Controllers
	const registerUserController =
		RegisterUserController.instance(registerUserUseCase);
	const loginController = LoginController.instance(loginUseCase);
	const changePasswordController = ChangePasswordController.instance(
		changePasswordUseCase,
	);

	// Routes
	const routes = Router();
	routes.use(
		"/user",
		createUserRoutes(
			tokenProvider,
			authorizationPolicy,
			registerUserController,
			loginController,
			changePasswordController,
			userRepo,
		),
	);

	return {
		app: ExpressApp.instance(routes),
		passwordHasher,
		tokenProvider,
		/** Mesmo caso de uso que o `main.ts` executa na inicialização. */
		bootstrapAdmin: bootstrapAdminUseCase,
	};
}
