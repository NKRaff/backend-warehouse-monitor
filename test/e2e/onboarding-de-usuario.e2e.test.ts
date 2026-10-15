import type { Express } from "express";
import request from "supertest";
import {
	afterAll,
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vitest";
import { AlertModel } from "@infrastructure/database/mongodb/models/alert.model.js";
import { AuditLogModel } from "@infrastructure/database/mongodb/models/audit-log.model.js";
import { NotificationModel } from "@infrastructure/database/mongodb/models/notification.model.js";
import { UserModel } from "@infrastructure/database/mongodb/models/user.model.js";
import {
	extractTemporaryPassword,
	FakeSmtpClient,
} from "../helpers/fake-smtp.js";
import {
	clearMongo,
	MONGO_STARTUP_TIMEOUT,
	startMongo,
	stopMongo,
} from "../helpers/mongo.js";
import { seedUser } from "../helpers/seed.js";
import { createTestApp } from "../helpers/test-app.js";

const smtp = new FakeSmtpClient();
let app: Express;

beforeAll(async () => {
	await startMongo();
	({ app } = createTestApp(smtp));
}, MONGO_STARTUP_TIMEOUT);

afterAll(stopMongo);

beforeEach(async () => {
	await clearMongo();
	smtp.reset();
	vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe("E2E • Ciclo de vida de acesso de um novo usuário (RF-BE-001/002/003/004/007/031)", () => {
	it("administrador cadastra → colaborador recebe a senha temporária → define a definitiva → passa a operar normalmente", async () => {
		// 1. O administrador (criado por seed, já com senha definitiva) entra no sistema
		const { user: admin, password: adminPassword } = await seedUser({
			role: "administrator",
			isDefaultPassword: false,
		});
		const adminSession = request.agent(app);
		await adminSession
			.post("/api/user/login")
			.send({ email: admin.email.value, password: adminPassword })
			.expect(200);

		// 2. Cadastra um operador
		const registered = await adminSession
			.post("/api/user/register")
			.send({ name: "Carlos Operador", email: "carlos@empresa.com", role: "operator" })
			.expect(201);
		const operatorId: string = registered.body.user.id;

		// 3. O operador recebe a senha temporária por e-mail
		await vi.waitFor(() => expect(smtp.outbox).toHaveLength(1));
		const temporaryPassword = extractTemporaryPassword(smtp.lastMail());
		expect(smtp.lastMail()?.to).toBe("carlos@empresa.com");
		expect(temporaryPassword).toBeTruthy();

		// 4. Primeiro login: autentica, mas o sistema exige a troca de senha
		const operatorSession = request.agent(app);
		const firstLogin = await operatorSession
			.post("/api/user/login")
			.send({ email: "carlos@empresa.com", password: temporaryPassword })
			.expect(200);
		expect(firstLogin.body.requiresPasswordChange).toBe(true);
		expect(firstLogin.body.user.role).toBe("operator");

		// 5. O operador não tem permissão para cadastrar outros usuários (RBAC)
		const forbidden = await operatorSession
			.post("/api/user/register")
			.send({ name: "Intruso Teste", email: "intruso@empresa.com", role: "administrator" });
		expect(forbidden.status).toBe(403);
		expect(await UserModel.countDocuments({ email: "intruso@empresa.com" })).toBe(0);

		// 6. Tenta uma senha fraca: recusada, continua com a temporária
		const weak = await operatorSession
			.patch("/api/user/change-password")
			.send({ password: "123", confirmPassword: "123" });
		expect(weak.status).toBe(422);
		expect((await UserModel.findById(operatorId))?.isDefaultPassword).toBe(true);

		// 7. Define uma senha forte
		await operatorSession
			.patch("/api/user/change-password")
			.send({ password: "NovaSenha@456", confirmPassword: "NovaSenha@456" })
			.expect(200);

		// 8. A senha temporária deixa de funcionar; a nova autentica sem exigir troca
		await request(app)
			.post("/api/user/login")
			.send({ email: "carlos@empresa.com", password: temporaryPassword })
			.expect(422);
		const secondLogin = await request(app)
			.post("/api/user/login")
			.send({ email: "carlos@empresa.com", password: "NovaSenha@456" })
			.expect(200);
		expect(secondLogin.body.requiresPasswordChange).toBe(false);

		// 9. Trilha de auditoria completa, na ordem em que os fatos aconteceram
		const trail = await AuditLogModel.find().sort({ _id: 1 }).lean();
		expect(trail.map((log) => [log.action, log.actorId])).toEqual([
			["login", admin.id],
			["create", admin.id],
			["login", operatorId],
			["change_password", operatorId],
			["login", operatorId],
		]);
		expect(trail[1]?.resourceId).toBe(operatorId);

		// 10. Alerta + notificação do cadastro ficaram registrados
		expect(await AlertModel.countDocuments({ type: "register_user" })).toBe(1);
		expect(await NotificationModel.countDocuments({ recipientId: operatorId })).toBe(1);
	});

	it("administrador recém-criado só cadastra depois de trocar a senha temporária", async () => {
		const { user, password } = await seedUser({
			role: "administrator",
			isDefaultPassword: true,
		});
		const session = request.agent(app);
		await session
			.post("/api/user/login")
			.send({ email: user.email.value, password })
			.expect(200);
		const newUser = { name: "Ana Gestora", email: "ana@empresa.com", role: "manager" };

		const blocked = await session.post("/api/user/register").send(newUser);
		expect(blocked.status).toBe(403);
		expect(blocked.body.mensagem).toMatch(/alterar sua senha/);

		await session
			.patch("/api/user/change-password")
			.send({ password: "NovaSenha@456", confirmPassword: "NovaSenha@456" })
			.expect(200);

		await session.post("/api/user/register").send(newUser).expect(201);
		expect(await UserModel.countDocuments({ email: "ana@empresa.com" })).toBe(1);
	});

	it("um e-mail não pode ser cadastrado duas vezes, mesmo escrito de formas diferentes", async () => {
		const { user, password } = await seedUser();
		const session = request.agent(app);
		await session
			.post("/api/user/login")
			.send({ email: user.email.value, password })
			.expect(200);

		await session
			.post("/api/user/register")
			.send({ name: "Carlos Operador", email: "carlos@empresa.com", role: "operator" })
			.expect(201);
		const duplicate = await session
			.post("/api/user/register")
			.send({ name: "Carlos Outro", email: "Carlos@Empresa.com", role: "manager" });

		expect(duplicate.status).toBe(409);
		expect(await UserModel.countDocuments({ email: "carlos@empresa.com" })).toBe(1);
	});
});
