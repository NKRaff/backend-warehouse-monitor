import { PasswordPolicyService } from "@application/services/password-policy.service.js";
import "dotenv/config";
import { BcryptPasswordHasherAdapter } from "./infraestructure/cryptography/bcrypt-password-hasher.adapter.js";
import { JwtTokenAdapter } from "./infraestructure/cryptography/jwt-token.adapter.js";
import { Mongoose } from "./infraestructure/database/mongodb/mongoose.js";
import { ExpressApp } from "./infraestructure/http/express/express.app.js";
import { Routes } from "./infraestructure/http/express/routes/routes.js";
import { HttpServer } from "./infraestructure/http/server.js";
import { UuidAdapter } from "./infraestructure/identifier/uuid.adapter.js";
import { MqttAdapter } from "./infraestructure/messaging/mqtt/mqtt.adapter.js";
import { WarehouseHandle } from "./infraestructure/messaging/websocket/handle/warehouse.handle.js";
import { SocketIO } from "./infraestructure/messaging/websocket/socket-io-adapter.js";

// Database

const database = Mongoose.instance();
await database.connect();

// Repositories

// Adapters

const _passwordHasher = BcryptPasswordHasherAdapter.instance();
const _tokenProvider = JwtTokenAdapter.instance();
const _uuidProvider = UuidAdapter.instance();

// Services

const _passwordPolicyService = PasswordPolicyService.instance();

// Use Cases

// Controllers

// Routes
const routes = Routes.instance();

// Socket Handlers
const warehouseHandler = new WarehouseHandle();

// Server

const app = ExpressApp.instance(routes);
const httpServer = HttpServer.instance(app);

httpServer.connect();

// Messaging

const clientMqtt = MqttAdapter.instance();
await clientMqtt.connect();

const socketServer = SocketIO.instance(httpServer.server());
socketServer.connect([warehouseHandler]);
