import { AuthorizationPolicy } from "@application/services/authorization-policy.js";
import { NotificationService } from "@application/services/notification.service.js";
import { PasswordPolicyService } from "@application/services/password-policy.service.js";
import { ChangePasswordUseCase } from "@application/use-cases/change-password.use-case.js";
import { LoginUseCase } from "@application/use-cases/login.use-case.js";
import { RegisterUserUseCase } from "@application/use-cases/register-user.use-case.js";
import { ChangePasswordController } from "@presentation/controllers/change-password.controller.js";
import { LoginController } from "@presentation/controllers/login.controller.js";
import { RegisterUserController } from "@presentation/controllers/register-user.controller.js";
import "dotenv/config";
import { Router } from "express";
import { BcryptPasswordHasherAdapter } from "./infraestructure/cryptography/bcrypt-password-hasher.adapter.js";
import { JwtTokenAdapter } from "./infraestructure/cryptography/jwt-token.adapter.js";
import { Mongoose } from "./infraestructure/database/mongodb/mongoose.js";
import { AlertRepository } from "./infraestructure/database/mongodb/repositories/alert.repository.js";
import { AuditLogRepository } from "./infraestructure/database/mongodb/repositories/audit-log.repository.js";
import { NotificationRepository } from "./infraestructure/database/mongodb/repositories/notification.repository.js";
import { UserRepository } from "./infraestructure/database/mongodb/repositories/user.repository.js";
import { ExpressApp } from "./infraestructure/http/express/express.app.js";
import { createUserRoutes } from "./infraestructure/http/express/routes/user.routes.js";
import { HttpServer } from "./infraestructure/http/server.js";
import { UuidAdapter } from "./infraestructure/identifier/uuid.adapter.js";
import { MqttAdapter } from "./infraestructure/messaging/mqtt/mqtt.adapter.js";
import { NodemailerAdapter } from "./infraestructure/messaging/smtp/nodemailer.adapter.js";
import { WarehouseHandle } from "./infraestructure/messaging/websocket/handle/warehouse.handle.js";
import { SocketIO } from "./infraestructure/messaging/websocket/socket-io-adapter.js";
import { EmailChannel } from "./infraestructure/notification/email-channel.js";

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
