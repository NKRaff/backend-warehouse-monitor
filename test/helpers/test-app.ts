import type { SmtpClient } from "@application/ports/smtp-client.interface.js";
import { AuthorizationPolicy } from "@application/services/authorization-policy.js";
import { NotificationService } from "@application/services/notification.service.js";
import { PasswordPolicyService } from "@application/services/password-policy.service.js";
import { ChangePasswordUseCase } from "@application/use-cases/change-password.use-case.js";
import { ChangeRoleUseCase } from "@application/use-cases/change-role.use-case.js";
import { CreateWarehouseUseCase } from "@application/use-cases/create-warehouse.use-case.js";
import { CreateDeviceUseCase } from "@application/use-cases/create-device.use-case.js";
import { DeleteDeviceUseCase } from "@application/use-cases/delete-device.use-case.js";
import { UpdateDeviceUseCase } from "@application/use-cases/update-device.use-case.js";
import { DeleteUserUseCase } from "@application/use-cases/delete-user.use-case.js";
import { DeleteWarehouseUseCase } from "@application/use-cases/delete-warehouse.use-case.js";
import { GetWarehouseUseCase } from "@application/use-cases/get-warehouse.use-case.js";
import { ListAllWarehouseUseCase } from "@application/use-cases/list-all-warehouse.use-case.js";
import { GeneratePasswordResetTokenUseCase } from "@application/use-cases/generate-password-reset-token.use-case.js";
import { LoginUseCase } from "@application/use-cases/login.use-case.js";
import { RefreshTokenUseCase } from "@application/use-cases/refresh-token.use-case.js";
import { RegisterUserUseCase } from "@application/use-cases/register-user.use-case.js";
import { UpdateUserUseCase } from "@application/use-cases/update-user-use-case.js";
import { UpdateWarehouseUseCase } from "@application/use-cases/update-warehouse.use-case.js";
import { BcryptPasswordHasherAdapter } from "@infrastructure/cryptography/bcrypt-password-hasher.adapter.js";
import { JwtTokenAdapter } from "@infrastructure/cryptography/jwt-token.adapter.js";
import { AlertRepository } from "@infrastructure/database/mongodb/repositories/alert.repository.js";
import { AuditLogRepository } from "@infrastructure/database/mongodb/repositories/audit-log.repository.js";
import { NotificationRepository } from "@infrastructure/database/mongodb/repositories/notification.repository.js";
import { TokenRepository } from "@infrastructure/database/mongodb/repositories/token.repository.js";
import { UserRepository } from "@infrastructure/database/mongodb/repositories/user.repository.js";
import { WarehouseRepository } from "@infrastructure/database/mongodb/repositories/warehouse.repository.js";
import { DeviceRepository } from "@infrastructure/database/mongodb/repositories/device.repository.js";
import { ExpressApp } from "@infrastructure/http/express/express.app.js";
import { createUserRoutes } from "@infrastructure/http/express/routes/user.routes.js";
import { createWarehouseRoutes } from "@infrastructure/http/express/routes/warehouse.routes.js";
import { createDeviceRoutes } from "@infrastructure/http/express/routes/device.routes.js";
import { UuidAdapter } from "@infrastructure/identifier/uuid.adapter.js";
import { EmailNotificationChannel } from "@infrastructure/notification/email/email-channel.js";
import { ChangePasswordController } from "@presentation/controllers/change-password.controller.js";
import { ChangeRoleController } from "@presentation/controllers/change-role.controller.js";
import { CreateWarehouseController } from "@presentation/controllers/create-warehouse.controller.js";
import { CreateDeviceController } from "@presentation/controllers/create-device.controller.js";
import { DeleteDeviceController } from "@presentation/controllers/delete-device.controller.js";
import { UpdateDeviceController } from "@presentation/controllers/update-device.controller.js";
import { DeleteUserController } from "@presentation/controllers/delete-user.controller.js";
import { DeleteWarehouseController } from "@presentation/controllers/delete-warehouse.controller.js";
import { GetWarehouseController } from "@presentation/controllers/get-warehouse.controller.js";
import { ListAllWarehouseController } from "@presentation/controllers/list-all-warehouse.controller.js";
import { GeneratePasswordResetTokenController } from "@presentation/controllers/generate-password-reset-token.controller.js";
import { LoginController } from "@presentation/controllers/login.controller.js";
import { RefreshTokenController } from "@presentation/controllers/refresh-token.controller.js";
import { RegisterUserController } from "@presentation/controllers/register-user.controller.js";
import { UpdateUserController } from "@presentation/controllers/update-user.controller.js";
import { UpdateWarehouseController } from "@presentation/controllers/update-warehouse.controller.js";
import { Router } from "express";
import { resetSingleton } from "./singleton.js";
import { createMqttClientMock } from "./mocks.js";

/**
 * Composition root de teste que espelha `src/main.ts`, sem broker MQTT,
 * Socket.IO, `listen()` ou SMTP real. Clientes externos são substituídos por fakes.
 */
export function createTestApp(smtp: SmtpClient) {
	resetSingleton(
		UserRepository,
		AlertRepository,
		NotificationRepository,
		AuditLogRepository,
		TokenRepository,
		WarehouseRepository,
		DeviceRepository,
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
		CreateWarehouseUseCase,
		CreateDeviceUseCase,
		DeleteDeviceUseCase,
		UpdateDeviceUseCase,
		DeleteWarehouseUseCase,
		UpdateWarehouseUseCase,
		GetWarehouseUseCase,
		ListAllWarehouseUseCase,
		RegisterUserController,
		LoginController,
		ChangePasswordController,
		RefreshTokenController,
		GeneratePasswordResetTokenController,
		CreateWarehouseController,
		CreateDeviceController,
		DeleteDeviceController,
		UpdateDeviceController,
		DeleteWarehouseController,
		UpdateWarehouseController,
		GetWarehouseController,
		ListAllWarehouseController,
	);

	const userRepo = UserRepository.instance();
	const alertRepo = AlertRepository.instance();
	const notificationRepo = NotificationRepository.instance();
	const auditLogRepo = AuditLogRepository.instance();
	const tokenRepo = TokenRepository.instance();
	const warehouseRepo = WarehouseRepository.instance();
	const deviceRepo = DeviceRepository.instance();
	const mqttClient = createMqttClientMock();

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
	const createWarehouseUseCase = CreateWarehouseUseCase.instance(
		uuidProvider,
		warehouseRepo,
		auditLogRepo,
	);
	const deleteWarehouseUseCase = DeleteWarehouseUseCase.instance(
		uuidProvider,
		warehouseRepo,
		auditLogRepo,
		deviceRepo,
	);
	const updateWarehouseUseCase = UpdateWarehouseUseCase.instance(
		uuidProvider,
		warehouseRepo,
		auditLogRepo,
	);
	const getWarehouseUseCase = GetWarehouseUseCase.instance(warehouseRepo);
	const listAllWarehouseUseCase = ListAllWarehouseUseCase.instance(warehouseRepo);
	const createDeviceUseCase = CreateDeviceUseCase.instance(deviceRepo);
	const updateDeviceUseCase = UpdateDeviceUseCase.instance(deviceRepo);
	const deleteDeviceUseCase = DeleteDeviceUseCase.instance(
		uuidProvider,
		mqttClient,
		deviceRepo,
		auditLogRepo,
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
	const createWarehouseController = CreateWarehouseController.instance(
		createWarehouseUseCase,
	);
	const deleteWarehouseController = DeleteWarehouseController.instance(
		deleteWarehouseUseCase,
	);
	const updateWarehouseController = UpdateWarehouseController.instance(
		updateWarehouseUseCase,
	);
	const getWarehouseController = GetWarehouseController.instance(getWarehouseUseCase);
	const listAllWarehouseController = ListAllWarehouseController.instance(listAllWarehouseUseCase);
	const createDeviceController = CreateDeviceController.instance(createDeviceUseCase);
	const updateDeviceController = UpdateDeviceController.instance(updateDeviceUseCase);
	const deleteDeviceController =
		DeleteDeviceController.instance(deleteDeviceUseCase);

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
	routes.use(
		"/warehouse",
		createWarehouseRoutes(
			tokenProvider,
			authorizationPolicy,
			createWarehouseController,
			deleteWarehouseController,
			updateWarehouseController,
			getWarehouseController,
			listAllWarehouseController,
		),
	);
	routes.use(
		"/device",
		createDeviceRoutes(
			tokenProvider,
			authorizationPolicy,
			createDeviceController,
			updateDeviceController,
			deleteDeviceController,
		),
	);

	return {
		app: ExpressApp.instance(routes),
		passwordHasher,
		tokenProvider,
		mqttClient,
	};
}
