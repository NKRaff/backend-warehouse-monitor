import type { Express } from "express";
import jwt from "jsonwebtoken";
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
import { env } from "@infrastructure/config/env.js";
import { AlertModel } from "@infrastructure/database/mongodb/models/alert.model.js";
import { AuditLogModel } from "@infrastructure/database/mongodb/models/audit-log.model.js";
import { NotificationModel } from "@infrastructure/database/mongodb/models/notification.model.js";
import { UserModel } from "@infrastructure/database/mongodb/models/user.model.js";
import {
	extractTemporaryPassword,
	FakeSmtpClient,
} from "../../helpers/fake-smtp.js";
import {
	clearMongo,
	MONGO_STARTUP_TIMEOUT,
	startMongo,
	stopMongo,
} from "../../helpers/mongo.js";
import { seedUser } from "../../helpers/seed.js";
import { createTestApp } from "../../helpers/test-app.js";

const LOGIN = "/api/user/login";
const REGISTER = "/api/user/register";
const CHANGE_PASSWORD = "/api/user/change-password";

const smtp = new FakeSmtpClient();
let app: Express;
let passwordHasher: ReturnType<typeof createTestApp>["passwordHasher"];

beforeAll(async () => {
	await startMongo();
	({ app, passwordHasher } = createTestApp(smtp));
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

/** Faz login e devolve um agente que reaproveita o cookie da sessão. */
async function loginAs(email: string, password: string) {
	const agent = request.agent(app);
	const response = await agent.post(LOGIN).send({ email, password });
	return { agent, response };
}

async function adminSession() {
	const { user, password } = await seedUser({
		role: "administrator",
		isDefaultPassword: false,
	});
	const { agent } = await loginAs(user.email.value, password);
	return { agent, admin: user };
}

const validNewUser = {
	name: "Carlos Operador",
	email: "carlos@empresa.com",
	role: "operator",
};

describe("POST /api/user/login — RF-BE-001", () => {
	it("autentica, devolve os dados públicos e grava o JWT em cookie httpOnly", async () => {
		const { user, password } = await seedUser({ role: "manager" });

		const res = await request(app)
			.post(LOGIN)
			.send({ email: user.email.value, password });

		expect(res.status).toBe(200);
		expect(res.body).toMatchObject({
			message: "Usuario autenticado com sucesso",
			user: {
				id: user.id,
				name: user.name,
				role: "manager",
				email: { value: user.email.value, isVerified: false },
			},
			requiresPasswordChange: false,
		});
		expect(res.body.accessToken).toBeUndefined();
		expect(res.body.user).not.toHaveProperty("password");
		expect(String(res.headers["set-cookie"])).toMatch(
			/access_token=[^;]+;.*HttpOnly/i,
		);
	});

	it("o cookie contém um JWT assinado com o `sub` do usuário", async () => {
		const { user, password } = await seedUser();

		const res = await request(app)
			.post(LOGIN)
			.send({ email: user.email.value, password });

		const token = /access_token=([^;]+)/.exec(
			String(res.headers["set-cookie"]),
		)?.[1];
		const payload = jwt.verify(token ?? "", env.jwt.secret) as jwt.JwtPayload;
		expect(payload.sub).toBe(user.id);
		expect(payload.exp).toBeDefined();
	});

	it("informa requiresPasswordChange quando o usuário ainda usa a senha temporária", async () => {
		const { user, password } = await seedUser({ isDefaultPassword: true });

		const res = await request(app)
			.post(LOGIN)
			.send({ email: user.email.value, password });

		expect(res.status).toBe(200);
		expect(res.body.requiresPasswordChange).toBe(true);
	});

	it("não diferencia maiúsculas/minúsculas no e-mail", async () => {
		const { user, password } = await seedUser();

		const res = await request(app)
			.post(LOGIN)
			.send({ email: user.email.value.toUpperCase(), password });

		expect(res.status).toBe(200);
	});

	it("registra o login na auditoria", async () => {
		const { user, password } = await seedUser();

		await request(app).post(LOGIN).send({ email: user.email.value, password });

		const logs = await AuditLogModel.find({ action: "login" });
		expect(logs).toHaveLength(1);
		expect(logs[0]?.actorId).toBe(user.id);
		expect(logs[0]?.resourceType).toBe("user");
	});

	it("senha incorreta => 422 'Credenciais invalidas', sem cookie e sem auditoria", async () => {
		const { user } = await seedUser();

		const res = await request(app)
			.post(LOGIN)
			.send({ email: user.email.value, password: "Errada@123" });

		expect(res.status).toBe(422);
		expect(res.body).toEqual({
			statusCode: 422,
			mensagem: "Credenciais invalidas",
		});
		expect(res.headers["set-cookie"]).toBeUndefined();
		expect(await AuditLogModel.countDocuments()).toBe(0);
	});

	it("e-mail inexistente => mesma resposta da senha incorreta (sem enumerar contas)", async () => {
		const res = await request(app)
			.post(LOGIN)
			.send({ email: "ninguem@empresa.com", password: "Senha@123" });

		expect(res.status).toBe(422);
		expect(res.body.mensagem).toBe("Credenciais invalidas");
	});

	it("usuário removido (soft delete) => 403 e sem cookie", async () => {
		const { user, password } = await seedUser({ deletedAt: new Date() });

		const res = await request(app)
			.post(LOGIN)
			.send({ email: user.email.value, password });

		expect(res.status).toBe(403);
		expect(res.body.statusCode).toBe(403);
		expect(res.headers["set-cookie"]).toBeUndefined();
	});

	it("corpo inválido => 400 com erros por campo", async () => {
		const res = await request(app).post(LOGIN).send({ email: "xyz" });

		expect(res.status).toBe(400);
		expect(res.body.mensagem).toBe("Erro na validação do input");
		expect(res.body.erros.map((e: { campo: string }) => e.campo).sort()).toEqual(
			["email", "password"],
		);
	});

	it("sem corpo => 400", async () => {
		const res = await request(app).post(LOGIN);

		expect(res.status).toBe(400);
	});

	it("JSON malformado => 400 'JSON invalido'", async () => {
		const res = await request(app)
			.post(LOGIN)
			.set("Content-Type", "application/json")
			.send("{ quebrado");

		expect(res.status).toBe(400);
		expect(res.body.mensagem).toBe("JSON invalido");
	});
});

describe("POST /api/user/register — RF-BE-002 / RF-BE-003 / RF-BE-006 / RF-BE-007", () => {
	describe("autenticação e autorização", () => {
		it("sem cookie => 401", async () => {
			const res = await request(app).post(REGISTER).send(validNewUser);

			expect(res.status).toBe(401);
			expect(res.body.mensagem).toMatch(/Token de acesso/);
		});

		it("token inválido => 401", async () => {
			const res = await request(app)
				.post(REGISTER)
				.set("Cookie", "access_token=lixo")
				.send(validNewUser);

			expect(res.status).toBe(401);
			expect(res.body.mensagem).toBe("Token de acesso inválido");
		});

		it("token expirado => 401", async () => {
			const { user } = await seedUser();
			const expired = jwt.sign(
				{ sub: user.id, exp: Math.floor(Date.now() / 1000) - 60 },
				env.jwt.secret,
			);

			const res = await request(app)
				.post(REGISTER)
				.set("Cookie", `access_token=${expired}`)
				.send(validNewUser);

			expect(res.status).toBe(401);
			expect(res.body.mensagem).toBe("Token de acesso expirado");
		});

		it("token válido de usuário que não existe mais => 401", async () => {
			const orphan = jwt.sign({ sub: "fantasma" }, env.jwt.secret);

			const res = await request(app)
				.post(REGISTER)
				.set("Cookie", `access_token=${orphan}`)
				.send(validNewUser);

			expect(res.status).toBe(401);
			expect(res.body.mensagem).toBe("Usuario não encontrado");
		});

		it.each(["manager", "operator"] as const)(
			"papel %s não pode cadastrar usuários => 403",
			async (role) => {
				const { user, password } = await seedUser({ role });
				const { agent } = await loginAs(user.email.value, password);

				const res = await agent.post(REGISTER).send(validNewUser);

				expect(res.status).toBe(403);
				expect(res.body.mensagem).toBe(
					"O Usuario não tem permissão para executar a ação",
				);
				expect(await UserModel.countDocuments({ email: validNewUser.email })).toBe(0);
			},
		);

		it("administrador ainda com senha temporária precisa trocá-la antes => 403", async () => {
			const { user, password } = await seedUser({
				role: "administrator",
				isDefaultPassword: true,
			});
			const { agent } = await loginAs(user.email.value, password);

			const res = await agent.post(REGISTER).send(validNewUser);

			expect(res.status).toBe(403);
			expect(res.body.mensagem).toMatch(/alterar sua senha/);
		});

		it("administrador removido (soft delete) com token ainda válido => 403", async () => {
			const { agent, admin } = await adminSession();
			await UserModel.updateOne({ _id: admin.id }, { deletedAt: new Date() });

			const res = await agent.post(REGISTER).send(validNewUser);

			expect(res.status).toBe(403);
			expect(res.body.mensagem).toBe("Usuario não esta ativo");
		});
	});

	describe("cadastro bem-sucedido", () => {
		it("cria o usuário e devolve 201 com os dados públicos", async () => {
			const { agent } = await adminSession();

			const res = await agent.post(REGISTER).send(validNewUser);

			expect(res.status).toBe(201);
			expect(res.body).toMatchObject({
				message: "Usuario cadastrado com sucesso",
				user: {
					name: "Carlos Operador",
					email: { value: "carlos@empresa.com", isVerified: false },
					role: "operator",
				},
			});
			expect(res.body.user.id).toEqual(expect.any(String));
		});

		it("persiste o usuário aguardando primeiro acesso, com senha apenas em hash", async () => {
			const { agent } = await adminSession();

			await agent.post(REGISTER).send(validNewUser);

			const stored = await UserModel.findOne({ email: "carlos@empresa.com" });
			expect(stored).not.toBeNull();
			expect(stored?.isDefaultPassword).toBe(true);
			expect(stored?.emailVerified).toBe(false);
			expect(stored?.role).toBe("operator");
			expect(stored?.password).toMatch(/^\$2[aby]\$/);
		});

		it("envia por e-mail a senha temporária que corresponde ao hash armazenado", async () => {
			const { agent } = await adminSession();

			await agent.post(REGISTER).send(validNewUser);

			await vi.waitFor(() => expect(smtp.outbox).toHaveLength(1));
			const mail = smtp.lastMail();
			const temporaryPassword = extractTemporaryPassword(mail);
			const stored = await UserModel.findOne({ email: "carlos@empresa.com" });
			expect(mail?.to).toBe("carlos@empresa.com");
			expect(mail?.subject).toBe("Acesso ao sistema disponibilizado");
			expect(mail?.html).toContain("Bem-vindo ao Sistema");
			expect(temporaryPassword).toBeTruthy();
			await expect(
				passwordHasher.compare(temporaryPassword ?? "", stored?.password ?? ""),
			).resolves.toBe(true);
		});

		it("registra alerta, notificação e auditoria da criação", async () => {
			const { agent, admin } = await adminSession();

			const res = await agent.post(REGISTER).send(validNewUser);

			const alert = await AlertModel.findOne({ type: "register_user" });
			const notification = await NotificationModel.findOne({
				recipientId: res.body.user.id,
			});
			const log = await AuditLogModel.findOne({ action: "create" });
			expect(alert?.severity).toBe("info");
			expect(notification?.alertId).toBe(alert?._id);
			expect([...(notification?.channels ?? [])]).toEqual(["email"]);
			expect(log?.actorId).toBe(admin.id);
			expect(log?.resourceId).toBe(res.body.user.id);
		});

		it("normaliza o e-mail (minúsculas) e o nome (sem espaços nas pontas)", async () => {
			const { agent } = await adminSession();

			const res = await agent
				.post(REGISTER)
				.send({ ...validNewUser, name: "  Carlos Operador ", email: "CARLOS@Empresa.COM" });

			expect(res.status).toBe(201);
			expect(res.body.user.name).toBe("Carlos Operador");
			expect(res.body.user.email.value).toBe("carlos@empresa.com");
		});

		it("a senha temporária enviada por e-mail é digitável e autentica o novo usuário", async () => {
			const { agent } = await adminSession();
			await agent.post(REGISTER).send(validNewUser).expect(201);
			await vi.waitFor(() => expect(smtp.outbox).toHaveLength(1));
			const temporaryPassword = extractTemporaryPassword(smtp.lastMail());

			expect(temporaryPassword).toMatch(/^[\x21-\x7e]{8,}$/);
			const res = await request(app)
				.post(LOGIN)
				.send({ email: validNewUser.email, password: temporaryPassword });
			expect(res.status).toBe(200);
			expect(res.body.requiresPasswordChange).toBe(true);
		});

		it("aceita nomes com acentos", async () => {
			const { agent } = await adminSession();

			const res = await agent
				.post(REGISTER)
				.send({ ...validNewUser, name: "João Álvares" });

			expect(res.status).toBe(201);
			expect(res.body.user.name).toBe("João Álvares");
		});

		it("aceita os três papéis do sistema", async () => {
			const { agent } = await adminSession();

			for (const role of ["operator", "manager", "administrator"]) {
				const res = await agent
					.post(REGISTER)
					.send({ ...validNewUser, email: `${role}@empresa.com`, role });
				expect(res.status).toBe(201);
			}
		});

		it("o cadastro é concluído mesmo se o envio do e-mail falhar", async () => {
			const { agent } = await adminSession();
			smtp.failNextWith(new Error("SMTP indisponível"));

			const res = await agent.post(REGISTER).send(validNewUser);

			expect(res.status).toBe(201);
			await vi.waitFor(() => expect(console.error).toHaveBeenCalled());
			expect(
				await UserModel.countDocuments({ email: "carlos@empresa.com" }),
			).toBe(1);
			expect(smtp.outbox).toHaveLength(0);
		});

		// Defeito conhecido (RF-BE-003: "armazena apenas o hash"): a senha temporária
		// é gravada em texto puro na descrição do alerta. Quando for corrigido,
		// remova o `.fails`.
		it.fails("NÃO persiste a senha temporária em texto puro (alertas/notificações)", async () => {
			const { agent } = await adminSession();

			await agent.post(REGISTER).send(validNewUser);

			await vi.waitFor(() => expect(smtp.outbox).toHaveLength(1));
			const temporaryPassword = extractTemporaryPassword(smtp.lastMail());
			expect(temporaryPassword).toBeTruthy();
			const alerts = await AlertModel.find();
			expect(
				alerts.some((a) => a.description.includes(temporaryPassword ?? "")),
			).toBe(false);
		});
	});

	describe("validações e conflitos", () => {
		it("e-mail já cadastrado => 409, sem duplicar nem reenviar e-mail", async () => {
			const { agent } = await adminSession();
			await agent.post(REGISTER).send(validNewUser).expect(201);
			await vi.waitFor(() => expect(smtp.outbox).toHaveLength(1));

			const res = await agent
				.post(REGISTER)
				.send({ ...validNewUser, email: "CARLOS@empresa.com" });

			expect(res.status).toBe(409);
			expect(res.body.mensagem).toBe("Email já cadastrado");
			expect(
				await UserModel.countDocuments({ email: "carlos@empresa.com" }),
			).toBe(1);
			expect(smtp.outbox).toHaveLength(1);
		});

		it.each([
			"<script>alert(1)</script>",
			"Maria & Filho",
			"Ana-Maria",
		])("nome com caracteres especiais (%j) => 422, sem criar usuário nem enviar e-mail", async (name) => {
			const { agent } = await adminSession();

			const res = await agent.post(REGISTER).send({ ...validNewUser, name });

			expect(res.status).toBe(422);
			expect(res.body.mensagem).toMatch(/caracteres especiais/);
			expect(await UserModel.countDocuments({ email: validNewUser.email })).toBe(0);
			expect(smtp.outbox).toHaveLength(0);
		});

		it("corpo inválido => 400 com erro por campo e nada é criado", async () => {
			const { agent } = await adminSession();

			const res = await agent
				.post(REGISTER)
				.send({ name: "Jo", email: "xyz", role: "root" });

			expect(res.status).toBe(400);
			expect(res.body.erros).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ campo: "name" }),
					expect.objectContaining({ campo: "email" }),
					expect.objectContaining({
						campo: "role",
						mensagem: "A função escolhida não é valida",
					}),
				]),
			);
			// só o administrador do teste existe
			expect(await UserModel.countDocuments()).toBe(1);
		});
	});
});

describe("PATCH /api/user/change-password — RF-BE-004", () => {
	const strong = { password: "NovaSenha@456", confirmPassword: "NovaSenha@456" };

	it("sem cookie => 401", async () => {
		const res = await request(app).patch(CHANGE_PASSWORD).send(strong);

		expect(res.status).toBe(401);
	});

	it("usuário com senha temporária define a definitiva (rota liberada para ele)", async () => {
		const { user, password } = await seedUser({
			role: "operator",
			isDefaultPassword: true,
		});
		const { agent } = await loginAs(user.email.value, password);

		const res = await agent.patch(CHANGE_PASSWORD).send(strong);

		expect(res.status).toBe(200);
		expect(res.body).toEqual({ message: "Nova senha definida com sucesso" });
		const stored = await UserModel.findById(user.id);
		expect(stored?.isDefaultPassword).toBe(false);
		await expect(
			passwordHasher.compare(strong.password, stored?.password ?? ""),
		).resolves.toBe(true);
	});

	it("depois da troca, só a nova senha autentica", async () => {
		const { user, password } = await seedUser({ isDefaultPassword: true });
		const { agent } = await loginAs(user.email.value, password);
		await agent.patch(CHANGE_PASSWORD).send(strong).expect(200);

		const withOld = await request(app)
			.post(LOGIN)
			.send({ email: user.email.value, password });
		const withNew = await request(app)
			.post(LOGIN)
			.send({ email: user.email.value, password: strong.password });

		expect(withOld.status).toBe(422);
		expect(withNew.status).toBe(200);
		expect(withNew.body.requiresPasswordChange).toBe(false);
	});

	it("registra a troca na auditoria", async () => {
		const { user, password } = await seedUser();
		const { agent } = await loginAs(user.email.value, password);

		await agent.patch(CHANGE_PASSWORD).send(strong);

		const log = await AuditLogModel.findOne({ action: "change_password" });
		expect(log?.actorId).toBe(user.id);
	});

	it("senha que não atende à política => 422 listando os critérios, sem alterar nada", async () => {
		const { user, password } = await seedUser({ isDefaultPassword: true });
		const { agent } = await loginAs(user.email.value, password);

		const res = await agent
			.patch(CHANGE_PASSWORD)
			.send({ password: "abc", confirmPassword: "abc" });

		expect(res.status).toBe(422);
		expect(res.body.mensagem).toMatch(/Senha invalida/);
		expect(res.body.mensagem).toMatch(/8 caracteres/);
		const stored = await UserModel.findById(user.id);
		expect(stored?.isDefaultPassword).toBe(true);
		await expect(
			passwordHasher.compare(password, stored?.password ?? ""),
		).resolves.toBe(true);
	});

	it("confirmação diferente da senha => 422", async () => {
		const { user, password } = await seedUser();
		const { agent } = await loginAs(user.email.value, password);

		const res = await agent
			.patch(CHANGE_PASSWORD)
			.send({ password: "NovaSenha@456", confirmPassword: "Outra@4567" });

		expect(res.status).toBe(422);
		expect(res.body.mensagem).toMatch(/não coincidem/);
	});

	it("corpo incompleto => 400", async () => {
		const { user, password } = await seedUser();
		const { agent } = await loginAs(user.email.value, password);

		const res = await agent.patch(CHANGE_PASSWORD).send({ password: "NovaSenha@456" });

		expect(res.status).toBe(400);
		expect(res.body.erros).toEqual([
			expect.objectContaining({ campo: "confirmPassword" }),
		]);
	});
});

describe("rotas inexistentes", () => {
	it("GET /api/user/login => 404 (a rota só aceita POST)", async () => {
		const res = await request(app).get(LOGIN);

		expect(res.status).toBe(404);
	});
});
