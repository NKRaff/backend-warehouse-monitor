import type { Express } from "express";
import request from "supertest";
import {
	afterAll,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
} from "vitest";
import { UserModel } from "@infrastructure/database/mongodb/models/user.model.js";
import { FakeSmtpClient } from "../helpers/fake-smtp.js";
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
});

const newUser = { name: "Carlos Operador", email: "carlos@empresa.com", role: "operator" };

async function login(email: string, password: string) {
	const agent = request.agent(app);
	const response = await agent.post("/api/user/login").send({ email, password });
	const token = /access_token=([^;]+)/.exec(
		String(response.headers["set-cookie"]),
	)?.[1];
	return { agent, token: token ?? "" };
}

describe("E2E • Sessão e autorização (RF-BE-006 / RF-BE-007 / RF-BE-008)", () => {
	it("nenhuma rota protegida responde sem autenticação", async () => {
		const register = await request(app).post("/api/user/register").send(newUser);
		const change = await request(app)
			.patch("/api/user/change-password")
			.send({ password: "NovaSenha@456", confirmPassword: "NovaSenha@456" });

		expect(register.status).toBe(401);
		expect(change.status).toBe(401);
	});

	it("rejeita um token cuja assinatura foi adulterada", async () => {
		const { user, password } = await seedUser();
		const { token } = await login(user.email.value, password);
		const tampered = `${token.slice(0, -4)}AAAA`;

		const res = await request(app)
			.post("/api/user/register")
			.set("Cookie", `access_token=${tampered}`)
			.send(newUser);

		expect(res.status).toBe(401);
		expect(await UserModel.countDocuments({ email: newUser.email })).toBe(0);
	});

	it("as permissões são reavaliadas a cada requisição: promover o papel vale sem novo login", async () => {
		const { user, password } = await seedUser({ role: "manager" });
		const { agent } = await login(user.email.value, password);

		const before = await agent.post("/api/user/register").send(newUser);
		expect(before.status).toBe(403);

		await UserModel.updateOne({ _id: user.id }, { role: "administrator" });

		const after = await agent.post("/api/user/register").send(newUser);
		expect(after.status).toBe(201);
	});

	it("rebaixar o papel durante a sessão revoga o acesso imediatamente", async () => {
		const { user, password } = await seedUser({ role: "administrator" });
		const { agent } = await login(user.email.value, password);
		await agent.post("/api/user/register").send(newUser).expect(201);

		await UserModel.updateOne({ _id: user.id }, { role: "operator" });

		const res = await agent
			.post("/api/user/register")
			.send({ ...newUser, email: "outro@empresa.com" });
		expect(res.status).toBe(403);
	});

	it("usuário removido durante a sessão perde o acesso, mesmo com token ainda válido", async () => {
		const { user, password } = await seedUser({ role: "administrator" });
		const { agent } = await login(user.email.value, password);
		await UserModel.updateOne({ _id: user.id }, { deletedAt: new Date() });

		const res = await agent.post("/api/user/register").send(newUser);

		// Decisão do projeto: usuário removido (soft delete) recebe 403.
		expect(res.status).toBe(403);
		expect(res.body.statusCode).toBe(403);
		expect(await UserModel.countDocuments({ email: newUser.email })).toBe(0);
	});

	it("usuário removido não consegue iniciar uma nova sessão", async () => {
		const { user, password } = await seedUser({ deletedAt: new Date() });

		const res = await request(app)
			.post("/api/user/login")
			.send({ email: user.email.value, password });

		// Decisão do projeto: usuário removido (soft delete) recebe 403.
		expect(res.status).toBe(403);
		expect(res.headers["set-cookie"]).toBeUndefined();
	});

	it("sessões de usuários diferentes não se misturam", async () => {
		const admin = await seedUser({ role: "administrator" });
		const operator = await seedUser({ role: "operator" });
		const adminSession = await login(admin.user.email.value, admin.password);
		const operatorSession = await login(operator.user.email.value, operator.password);

		const byAdmin = await adminSession.agent.post("/api/user/register").send(newUser);
		const byOperator = await operatorSession.agent
			.post("/api/user/register")
			.send({ ...newUser, email: "outro@empresa.com" });

		expect(byAdmin.status).toBe(201);
		expect(byOperator.status).toBe(403);
	});
});
