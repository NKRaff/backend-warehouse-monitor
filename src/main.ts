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
import "dotenv/config";
import { Router } from "express";
import { BcryptPasswordHasherAdapter } from "./infrastructure/cryptography/bcrypt-password-hasher.adapter.js";
import { JwtTokenAdapter } from "./infrastructure/cryptography/jwt-token.adapter.js";
import { Mongoose } from "./infrastructure/database/mongodb/mongoose.js";
import { AlertRepository } from "./infrastructure/database/mongodb/repositories/alert.repository.js";
import { AuditLogRepository } from "./infrastructure/database/mongodb/repositories/audit-log.repository.js";
import { NotificationRepository } from "./infrastructure/database/mongodb/repositories/notification.repository.js";
import { UserRepository } from "./infrastructure/database/mongodb/repositories/user.repository.js";
import { ExpressApp } from "./infrastructure/http/express/express.app.js";
import { createUserRoutes } from "./infrastructure/http/express/routes/user.routes.js";
import { HttpServer } from "./infrastructure/http/server.js";
import { UuidAdapter } from "./infrastructure/identifier/uuid.adapter.js";
import { MqttAdapter } from "./infrastructure/messaging/mqtt/mqtt.adapter.js";
import { NodemailerAdapter } from "./infrastructure/messaging/smtp/nodemailer.adapter.js";
import { WarehouseHandle } from "./infrastructure/messaging/websocket/handle/warehouse.handle.js";
import { SocketIO } from "./infrastructure/messaging/websocket/socket-io-adapter.js";
import { EmailChannel } from "./infrastructure/notification/email-channel.js";

// Database

const database = Mongoose.instance();
await database.connect();

// Messaging

const clientMqtt = MqttAdapter.instance();
await clientMqtt.connect();

const clientSmtp = NodemailerAdapter.instance();

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

const emailChannel = EmailChannel.instance(clientSmtp);

// Services

const passwordPolicyService = PasswordPolicyService.instance();
const notificationService = NotificationService.instance([emailChannel]);
const authorizationPolicyService = AuthorizationPolicy.instance(userRepo);

// Use Cases

const registerUserUseCase = RegisterUserUseCase.instance(
	uuidProvider,
	passwordHasher,
	userRepo,
	alertRepo,
	notificationRepo,
	auditLogRepo,
	notificationService,
);
const bootstrapAdmin = BootstrapAdminUseCase.instance(
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
const userRoutes = createUserRoutes(
	tokenProvider,
	authorizationPolicyService,
	registerUserController,
	loginController,
	changePasswordController,
	userRepo,
);

routes.use("/user", userRoutes);

// Socket Handlers
const warehouseHandler = new WarehouseHandle();

// Server

const app = ExpressApp.instance(routes);
const httpServer = HttpServer.instance(app);

httpServer.connect();

const socketServer = SocketIO.instance(httpServer.server());
socketServer.connect([warehouseHandler]);

// Bootstrap
try {
	bootstrapAdmin.execute({ name: "teste", email: "teste@email.com" });
} catch {}
