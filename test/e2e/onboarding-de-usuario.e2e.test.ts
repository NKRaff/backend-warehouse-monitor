import { AuditLogModel } from "@infrastructure/database/mongodb/models/audit-log.model.js";
import { TokenModel } from "@infrastructure/database/mongodb/models/token.model.js";
import { UserModel } from "@infrastructure/database/mongodb/models/user.model.js";
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
	vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
	vi.restoreAllMocks();
});

async function registerOperator() {
	const { user: admin, password } = await seedUser({
		role: "administrator",
		isDefaultPassword: false,
	});
	const adminSession = request.agent(app);
	await adminSession
		.post("/api/user/login")
		.send({ email: admin.email.value, password })
		.expect(200);
	const response = await adminSession
		.post("/api/user/register")
		.send({ name: "Carlos Operador", email: "carlos@empresa.com", role: "operator" })
		.expect(201);
	return { admin, adminSession, operatorId: response.body.user.id as string };
}

function tokenFromLastEmail(): string {
	const html = smtp.lastMail()?.html ?? "";
	const token = /[?&amp;]token=([a-f0-9]{64})/.exec(html)?.[1];
	expect(token).toBeDefined();
	return token as string;
}

describe("E2E • redefinição de senha de um novo usuário — RF-BE-002 / RF-BE-005 / RF-BE-031", () => {
	it("admin cadastra → usuário solicita link → redefine a senha → entra com a nova senha", async () => {
		const { admin, operatorId } = await registerOperator();
		await vi.waitFor(() => expect(smtp.outbox).toHaveLength(1));

		const resetResponse = await request(app)
			.post("/api/user/generate-password-reset-token")
			.send({ email: "CARLOS@EMPRESA.COM" });
		expect(resetResponse.status).toBe(200);
		await vi.waitFor(() => expect(smtp.outbox).toHaveLength(2));
		const plainToken = tokenFromLastEmail();
		const storedToken = await TokenModel.findOne({ userId: operatorId });
		expect(storedToken?.valueHash).not.toBe(plainToken);
		expect(storedToken?.type).toBe("password_reset");

		const weakPassword = await request(app)
			.patch(`/api/user/change-password/${plainToken}`)
			.send({ password: "abc", confirmPassword: "abc" });
		expect(weakPassword.status).toBe(422);
		expect(await TokenModel.countDocuments({ userId: operatorId })).toBe(1);

		const changed = await request(app)
			.patch(`/api/user/change-password/${plainToken}`)
			.send({ password: "NovaSenha@456", confirmPassword: "NovaSenha@456" });
		expect(changed.status).toBe(200);
		expect(await TokenModel.countDocuments({ userId: operatorId })).toBe(0);

		const login = await request(app)
			.post("/api/user/login")
			.send({ email: "carlos@empresa.com", password: "NovaSenha@456" });
		expect(login.status).toBe(200);
		expect(login.body.user.id).toBe(operatorId);
		expect(login.body).not.toHaveProperty("requiresPasswordChange");

		const logs = await AuditLogModel.find({ resourceId: operatorId });
		expect(logs.map((log) => log.action)).toEqual(
			expect.arrayContaining(["create", "change_password", "login"]),
		);
		expect(logs.find((log) => log.action === "create")?.actorId).toBe(admin.id);
	});

	it("e-mail duplicado continua retornando 409", async () => {
		const { adminSession } = await registerOperator();

		const duplicate = await adminSession
			.post("/api/user/register")
			.send({ name: "Carlos Outro", email: "Carlos@Empresa.com", role: "manager" });

		expect(duplicate.status).toBe(409);
		expect(await UserModel.countDocuments({ email: "carlos@empresa.com" })).toBe(1);
	});
});
