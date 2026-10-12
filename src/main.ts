import { NotificationService } from "@application/services/notification.service.js";
import { PasswordPolicyService } from "@application/services/password-policy.service.js";
import { RegisterUserUseCase } from "@application/use-cases/register-user.use-case.js";
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
const _tokenProvider = JwtTokenAdapter.instance();
const uuidProvider = UuidAdapter.instance();

// Notification

const emailChannel = EmailChannel.instance(clientSmtp);

// Services

const _passwordPolicyService = PasswordPolicyService.instance();
const notificationService = NotificationService.instance([emailChannel]);

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

// Controllers

const registerUserController =
	RegisterUserController.instance(registerUserUseCase);

// Routes
const routes = Router();
const userRoutes = createUserRoutes(registerUserController);

routes.use("/user", userRoutes);

// Socket Handlers
const warehouseHandler = new WarehouseHandle();

// Server

const app = ExpressApp.instance(routes);
const httpServer = HttpServer.instance(app);

httpServer.connect();

const socketServer = SocketIO.instance(httpServer.server());
socketServer.connect([warehouseHandler]);
