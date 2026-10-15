import { AuditLogModel } from "@infrastructure/database/mongodb/models/audit-log.model.js";
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
let bootstrapAdmin: ReturnType<typeof createTestApp>["bootstrapAdmin"];

beforeAll(async () => {
	await startMongo();
	({ app, bootstrapAdmin } = createTestApp(smtp));
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

const initialAdmin = {
	name: "Administrador Inicial",
	email: "admin@empresa.com",
};

describe("E2E • Bootstrap do primeiro administrador (RF-BE-002/003/004/007)", () => {
	it("sistema vazio → cria o administrador → senha temporária por e-mail → troca de senha → passa a cadastrar usuários", async () => {
		// 1. Inicialização do sistema sem nenhum usuário
		expect(await UserModel.countDocuments()).toBe(0);
		await bootstrapAdmin.execute(initialAdmin);

		// 2. O administrador recebe a senha temporária por e-mail
		await vi.waitFor(() => expect(smtp.outbox).toHaveLength(1));
		const mail = smtp.lastMail();
		const temporaryPassword = extractTemporaryPassword(mail);
		expect(mail?.to).toBe("admin@empresa.com");
		expect(temporaryPassword).toMatch(/^[\x21-\x7e]{8,}$/);
		const stored = await UserModel.findOne({ email: "admin@empresa.com" });
		expect(stored?.role).toBe("administrator");
		expect(stored?.isDefaultPassword).toBe(true);
		expect(stored?.password).not.toBe(temporaryPassword);

		// 3. Primeiro login: autentica, mas exige a troca da senha
		const session = request.agent(app);
		const login = await session
			.post("/api/user/login")
			.send({ email: "admin@empresa.com", password: temporaryPassword })
			.expect(200);
		expect(login.body.requiresPasswordChange).toBe(true);
		expect(login.body.user.role).toBe("administrator");

		// 4. Enquanto a senha for a temporária, não cadastra ninguém
		const newUser = { name: "Carlos Operador", email: "carlos@empresa.com", role: "operator" };
		const blocked = await session.post("/api/user/register").send(newUser);
		expect(blocked.status).toBe(403);
		expect(blocked.body.mensagem).toMatch(/alterar sua senha/);

		// 5. Define a senha definitiva
		await session
			.patch("/api/user/change-password")
			.send({ password: "NovaSenha@456", confirmPassword: "NovaSenha@456" })
			.expect(200);

		// 6. Agora cadastra usuários normalmente
		await session.post("/api/user/register").send(newUser).expect(201);
		expect(await UserModel.countDocuments({ email: "carlos@empresa.com" })).toBe(1);

		// 7. Trilha de auditoria: criação pelo sistema, depois as ações do administrador
		const trail = await AuditLogModel.find().sort({ _id: 1 }).lean();
		expect(trail.map((log) => [log.action, log.actorId])).toEqual([
			["create", "system"],
			["login", stored?._id],
			["change_password", stored?._id],
			["create", stored?._id],
		]);
	});

	it("é idempotente: executar o bootstrap de novo não cria outro administrador nem reenvia e-mail", async () => {
		await bootstrapAdmin.execute(initialAdmin);
		await vi.waitFor(() => expect(smtp.outbox).toHaveLength(1));

		await bootstrapAdmin.execute(initialAdmin);
		await bootstrapAdmin.execute({ name: "Outro Admin", email: "outro@empresa.com" });

		expect(await UserModel.countDocuments({ role: "administrator" })).toBe(1);
		expect(smtp.outbox).toHaveLength(1);
	});

	it("não cria nada quando o sistema já tem um administrador", async () => {
		await seedUser({ role: "administrator" });

		await bootstrapAdmin.execute(initialAdmin);

		expect(await UserModel.countDocuments({ email: "admin@empresa.com" })).toBe(0);
		expect(smtp.outbox).toHaveLength(0);
	});

	it("falha de SMTP não impede a criação do administrador", async () => {
		smtp.failNextWith(new Error("SMTP indisponível"));

		await expect(bootstrapAdmin.execute(initialAdmin)).resolves.toBeUndefined();

		await vi.waitFor(() => expect(console.error).toHaveBeenCalled());
		expect(await UserModel.countDocuments({ email: "admin@empresa.com" })).toBe(1);
		expect(smtp.outbox).toHaveLength(0);
	});

	it("dados inválidos do administrador inicial não criam usuário", async () => {
		await expect(
			bootstrapAdmin.execute({ name: "<script>x</script>", email: "admin@empresa.com" }),
		).rejects.toThrow(/caracteres especiais/);

		expect(await UserModel.countDocuments()).toBe(0);
		expect(smtp.outbox).toHaveLength(0);
	});
});
