import { env } from "@infrastructure/config/env.js";
import { AlertModel } from "@infrastructure/database/mongodb/models/alert.model.js";
import { AuditLogModel } from "@infrastructure/database/mongodb/models/audit-log.model.js";
import { NotificationModel } from "@infrastructure/database/mongodb/models/notification.model.js";
import { TokenModel } from "@infrastructure/database/mongodb/models/token.model.js";
import { UserModel } from "@infrastructure/database/mongodb/models/user.model.js";
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
import { FakeSmtpClient } from "../../helpers/fake-smtp.js";
import {
	clearMongo,
	MONGO_STARTUP_TIMEOUT,
	startMongo,
	stopMongo,
} from "../../helpers/mongo.js";
import { seedUser } from "../../helpers/seed.js";
import { createTestApp } from "../../helpers/test-app.js";

const LOGIN = "/api/user/login";
const REFRESH_TOKEN = "/api/user/refresh-token";
const REGISTER = "/api/user/register";
const RESET_PASSWORD = "/api/user/change-password";
const GENERATE_RESET_TOKEN = "/api/user/generate-password-reset-token";
const UPDATE_USER = "/api/user/update_user";
const CHANGE_ROLE = "/api/user/change-role";
const DELETE_USER = "/api/user/delete_user";

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

	it("não informa estado de senha temporária, que não faz parte da resposta atual", async () => {
		const { user, password } = await seedUser({ isDefaultPassword: true });

		const res = await request(app)
			.post(LOGIN)
			.send({ email: user.email.value, password });

		expect(res.status).toBe(200);
		expect(res.body).not.toHaveProperty("requiresPasswordChange");
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
		expect(
			res.body.erros.map((e: { campo: string }) => e.campo).sort(),
		).toEqual(["email", "password"]);
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

describe("GET /api/user/refresh-token — RF-BE-001", () => {
	it("sem cookie refresh_token responde 401", async () => {
		const response = await request(app).get(REFRESH_TOKEN);

		expect(response.status).toBe(401);
		expect(response.body.mensagem).toBe("Refresh token não encontrado nos cookies");
		expect(response.headers["set-cookie"]).toBeUndefined();
	});

	it("rotaciona refresh token e renova os cookies da sessão", async () => {
		const { user, password } = await seedUser();
		const { agent, response: loginResponse } = await loginAs(
			user.email.value,
			password,
		);
		const originalRefresh = /refresh_token=([^;]+)/.exec(
			String(loginResponse.headers["set-cookie"]),
		)?.[1];
		expect(originalRefresh).toBeDefined();

		const response = await agent.get(REFRESH_TOKEN);

		expect(response.status).toBe(200);
		expect(response.body).toBe("Token resetado com sucesso");
		const cookies = String(response.headers["set-cookie"]);
		const rotatedRefresh = /refresh_token=([^;]+)/.exec(cookies)?.[1];
		expect(cookies).toMatch(/access_token=[^;]+;.*HttpOnly/i);
		expect(cookies).toMatch(/refresh_token=[^;]+;.*HttpOnly/i);
		expect(rotatedRefresh).toBeDefined();
		expect(rotatedRefresh).not.toBe(originalRefresh);
		expect(await TokenModel.countDocuments({ userId: user.id, type: "refresh" })).toBe(1);

		const replay = await request(app)
			.get(REFRESH_TOKEN)
			.set("Cookie", `refresh_token=${originalRefresh}`);
		expect(replay.status).toBe(404);
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
				expect(
					await UserModel.countDocuments({ email: validNewUser.email }),
				).toBe(0);
			},
		);

		it("não bloqueia administrador pelo estado de senha armazenado fora da entidade", async () => {
			const { user, password } = await seedUser({
				role: "administrator",
				isDefaultPassword: true,
			});
			const { agent } = await loginAs(user.email.value, password);

			const res = await agent.post(REGISTER).send(validNewUser);

			expect(res.status).toBe(201);
			expect(
				await UserModel.countDocuments({ email: validNewUser.email }),
			).toBe(1);
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
			expect(stored?.emailVerified).toBe(false);
			expect(stored?.role).toBe("operator");
			expect(stored?.password).toMatch(/^\$2[aby]\$/);
		});

		it("envia aviso de definição de senha sem incluir a senha em texto puro", async () => {
			const { agent } = await adminSession();

			await agent.post(REGISTER).send(validNewUser);

			await vi.waitFor(() => expect(smtp.outbox).toHaveLength(1));
			const mail = smtp.lastMail();
			const stored = await UserModel.findOne({ email: "carlos@empresa.com" });
			expect(mail?.to).toBe("carlos@empresa.com");
			expect(mail?.subject).toBe("Novo link para definir sua senha");
			expect(mail?.html).toContain("Foi solicitado um novo link");
			expect(mail?.html).not.toContain("Senha temporária:");
			expect(stored?.password).toMatch(/^\$2[aby]\$/);
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

			const res = await agent.post(REGISTER).send({
				...validNewUser,
				name: "  Carlos Operador ",
				email: "CARLOS@Empresa.COM",
			});

			expect(res.status).toBe(201);
			expect(res.body.user.name).toBe("Carlos Operador");
			expect(res.body.user.email.value).toBe("carlos@empresa.com");
		});

		it("não devolve flag de senha temporária no login após cadastro", async () => {
			const { agent } = await adminSession();
			await agent.post(REGISTER).send(validNewUser).expect(201);
			await vi.waitFor(() => expect(smtp.outbox).toHaveLength(1));
			expect(smtp.lastMail()?.html).not.toContain("Senha temporária:");
			const res = await request(app).post(LOGIN).send({
				email: validNewUser.email,
				password: "senha-desconhecida",
			});
			expect(res.status).toBe(422);
			expect(res.body).not.toHaveProperty("requiresPasswordChange");
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

		it.each(["<script>alert(1)</script>", "Maria & Filho", "Ana-Maria"])(
			"nome com caracteres especiais (%j) => 422, sem criar usuário nem enviar e-mail",
			async (name) => {
				const { agent } = await adminSession();

				const res = await agent.post(REGISTER).send({ ...validNewUser, name });

				expect(res.status).toBe(422);
				expect(res.body.mensagem).toMatch(/caracteres especiais/);
				expect(
					await UserModel.countDocuments({ email: validNewUser.email }),
				).toBe(0);
				expect(smtp.outbox).toHaveLength(0);
			},
		);

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

describe("RF-BE-005 — redefinição de senha por token", () => {
	const strong = {
		password: "NovaSenha@456",
		confirmPassword: "NovaSenha@456",
	};

	function requestReset(email: string) {
		return request(app).post(GENERATE_RESET_TOKEN).send({ email });
	}

	async function latestResetToken() {
		await vi.waitFor(() => expect(smtp.outbox).toHaveLength(1));
		const html = smtp.lastMail()?.html ?? "";
		const token = /[?&amp;]token=([a-f0-9]{64})/.exec(html)?.[1];
		expect(token).toBeDefined();
		return token as string;
	}

	it("solicita redefinição sem sessão, envia o link e consome o token ao trocar a senha", async () => {
		const { user } = await seedUser({ role: "operator" });

		const requestResponse = await requestReset(user.email.value.toUpperCase());

		expect(requestResponse.status).toBe(200);
		expect(requestResponse.body.message).toBe(
			"Token de redefinição de senha enviado por email",
		);
		const plainToken = await latestResetToken();
		const storedToken = await TokenModel.findOne({ userId: user.id });
		expect(storedToken?.valueHash).not.toBe(plainToken);
		expect(storedToken?.type).toBe("password_reset");

		const result = await request(app)
			.patch(`${RESET_PASSWORD}/${plainToken}`)
			.send(strong);

		expect(result.status).toBe(200);
		expect(result.body).toEqual({ message: "Nova senha definida com sucesso" });
		const updatedUser = await UserModel.findById(user.id);
		await expect(
			passwordHasher.compare(strong.password, updatedUser?.password ?? ""),
		).resolves.toBe(true);
		expect(await TokenModel.countDocuments({ userId: user.id })).toBe(0);
		const log = await AuditLogModel.findOne({ action: "change_password" });
		expect(log?.actorId).toBe(user.id);
	});

	it("uma nova solicitação invalida o link anterior e mantém apenas o mais recente", async () => {
		const { user } = await seedUser();
		expect((await requestReset(user.email.value)).status).toBe(200);
		const firstToken = await latestResetToken();
		smtp.reset();

		expect((await requestReset(user.email.value)).status).toBe(200);
		const newestToken = await latestResetToken();
		expect(newestToken).not.toBe(firstToken);
		expect(await TokenModel.countDocuments({ userId: user.id })).toBe(1);

		const oldLink = await request(app)
			.patch(`${RESET_PASSWORD}/${firstToken}`)
			.send(strong);
		expect(oldLink.status).toBe(404);

		const latestLink = await request(app)
			.patch(`${RESET_PASSWORD}/${newestToken}`)
			.send(strong);
		expect(latestLink.status).toBe(200);
	});

	it("rejeita token expirado sem trocar a senha nem consumir o token", async () => {
		const { user, password } = await seedUser();
		expect((await requestReset(user.email.value)).status).toBe(200);
		const plainToken = await latestResetToken();
		await TokenModel.updateOne(
			{ userId: user.id },
			{ expiresAt: new Date(Date.now() - 1) },
		);

		const response = await request(app)
			.patch(`${RESET_PASSWORD}/${plainToken}`)
			.send(strong);

		expect(response.status).toBe(401);
		expect(await TokenModel.countDocuments({ userId: user.id })).toBe(1);
		const unchanged = await UserModel.findById(user.id);
		await expect(
			passwordHasher.compare(password, unchanged?.password ?? ""),
		).resolves.toBe(true);
	});

	it("senha fraca não altera a senha nem consome o token", async () => {
		const { user, password } = await seedUser();
		expect((await requestReset(user.email.value)).status).toBe(200);
		const plainToken = await latestResetToken();

		const response = await request(app)
			.patch(`${RESET_PASSWORD}/${plainToken}`)
			.send({ password: "abc", confirmPassword: "abc" });

		expect(response.status).toBe(422);
		expect(response.body.mensagem).toMatch(/Senha invalida/);
		expect(await TokenModel.countDocuments({ userId: user.id })).toBe(1);
		const unchanged = await UserModel.findById(user.id);
		await expect(
			passwordHasher.compare(password, unchanged?.password ?? ""),
		).resolves.toBe(true);
	});

	it("e-mail não cadastrado retorna o 404 atual sem criar token", async () => {
		const response = await requestReset("inexistente@empresa.com");

		expect(response.status).toBe(404);
		expect(await TokenModel.countDocuments()).toBe(0);
		expect(smtp.outbox).toHaveLength(0);
	});

	it("corpo inválido para solicitação retorna 400 sem criar token", async () => {
		const response = await request(app)
			.post(GENERATE_RESET_TOKEN)
			.send({ email: "inválido" });

		expect(response.status).toBe(400);
		expect(response.body.erros).toEqual([
			expect.objectContaining({ campo: "email" }),
		]);
		expect(await TokenModel.countDocuments()).toBe(0);
	});
});

describe("rotas inexistentes", () => {
	it("GET /api/user/login => 404 (a rota só aceita POST)", async () => {
		const res = await request(app).get(LOGIN);

		expect(res.status).toBe(404);
	});
});

describe("edição, papel e remoção de usuários — RF-BE-008/RF-BE-009", () => {
	it("atualiza nome e e-mail e persiste auditoria", async () => {
		const { agent } = await adminSession();
		const target = await seedUser({ role: "operator" });
		const response = await agent.patch(UPDATE_USER).send({ userId: target.user.id, name: "Carlos Souza", email: "carlos@empresa.com" });
		expect(response.status).toBe(200);
		expect(response.body.user).toMatchObject({ id: target.user.id, name: "Carlos Souza", email: { value: "carlos@empresa.com" } });
		expect(await UserModel.findById(target.user.id)).toMatchObject({ name: "Carlos Souza", email: "carlos@empresa.com" });
		expect(await AuditLogModel.countDocuments({ resourceId: target.user.id, action: "update" })).toBe(1);
	});

	it("rejeita atualização vazia com 422", async () => {
		const { agent } = await adminSession();
		const target = await seedUser({ role: "operator" });
		const response = await agent.patch(UPDATE_USER).send({ userId: target.user.id });
		expect(response.status).toBe(422);
	});

	it("permite a operador editar o próprio perfil conforme a matriz atual", async () => {
		const target = await seedUser({ role: "operator" });
		const { agent } = await loginAs(target.user.email.value, target.password);
		const response = await agent.patch(UPDATE_USER).send({ userId: target.user.id, name: "Operador Editado" });
		expect(response.status).toBe(200);
	});

	it("altera papel somente para administrador e grava ator na auditoria", async () => {
		const { agent, admin } = await adminSession();
		const target = await seedUser({ role: "operator" });
		const response = await agent.patch(CHANGE_ROLE).send({ userId: target.user.id, role: "manager" });
		expect(response.status).toBe(200);
		expect(await UserModel.findById(target.user.id)).toMatchObject({ role: "manager" });
		expect(await AuditLogModel.findOne({ resourceId: target.user.id, action: "update" })).toMatchObject({ actorId: admin.id, metadata: { old: "operator", new: "manager" } });
	});

	it("remove em soft delete, grava auditoria e apaga os tokens do usuário", async () => {
		const { agent, admin } = await adminSession();
		const target = await seedUser({ role: "operator" });
		await TokenModel.create({ _id: "refresh-1", userId: target.user.id, type: "refresh", valueHash: "hash", expiresAt: new Date(Date.now() + 60_000) });
		const response = await agent.delete(DELETE_USER).send({ userId: target.user.id });
		expect(response.status).toBe(200);
		expect(await UserModel.findById(target.user.id)).toHaveProperty("deletedAt");
		expect(await TokenModel.countDocuments({ userId: target.user.id })).toBe(0);
		expect(await AuditLogModel.findOne({ resourceId: target.user.id, action: "delete" })).toMatchObject({ actorId: admin.id });
	});

	it("não remove o último administrador ativo", async () => {
		const { agent, admin } = await adminSession();
		const response = await agent.delete(DELETE_USER).send({ userId: admin.id });
		expect(response.status).toBe(422);
		expect((await UserModel.findById(admin.id))?.deletedAt).toBeUndefined();
	});

	it("nega a operador a alteração de papel e a remoção", async () => {
		const target = await seedUser({ role: "operator" });
		const { agent } = await loginAs(target.user.email.value, target.password);
		expect((await agent.patch(CHANGE_ROLE).send({ userId: target.user.id, role: "manager" })).status).toBe(403);
		expect((await agent.delete(DELETE_USER).send({ userId: target.user.id })).status).toBe(403);
	});

	it("exige sessão para alterar papel ou remover usuário", async () => {
		await request(app).patch(CHANGE_ROLE).send({ userId: "target", role: "manager" }).expect(401);
		await request(app).delete(DELETE_USER).send({ userId: "target" }).expect(401);
	});

	it("rejeita papel inválido sem alterar o usuário", async () => {
		const { agent } = await adminSession();
		const target = await seedUser({ role: "operator" });

		const response = await agent.patch(CHANGE_ROLE).send({ userId: target.user.id, role: "owner" });

		expect(response.status).toBe(400);
		expect(response.body.erros).toEqual(expect.arrayContaining([
			expect.objectContaining({ campo: "role" }),
		]));
		expect((await UserModel.findById(target.user.id))?.role).toBe("operator");
		expect(await AuditLogModel.countDocuments({ resourceId: target.user.id })).toBe(0);
	});

	it("retorna 404 ao alterar o papel de usuário inexistente", async () => {
		const { agent } = await adminSession();

		const response = await agent.patch(CHANGE_ROLE).send({ userId: "missing-user", role: "manager" });

		expect(response.status).toBe(404);
		expect(await AuditLogModel.countDocuments({ resourceId: "missing-user" })).toBe(0);
	});

	it("retorna 404 ao remover usuário inexistente", async () => {
		const { agent } = await adminSession();

		const response = await agent.delete(DELETE_USER).send({ userId: "missing-user" });

		expect(response.status).toBe(404);
		expect(await AuditLogModel.countDocuments({ resourceId: "missing-user" })).toBe(0);
	});

	it("permite remover um administrador quando outro permanece ativo", async () => {
		const { agent } = await adminSession();
		const secondAdmin = await seedUser({ role: "administrator" });

		const response = await agent.delete(DELETE_USER).send({ userId: secondAdmin.user.id });

		expect(response.status).toBe(200);
		expect((await UserModel.findById(secondAdmin.user.id))?.deletedAt).toBeInstanceOf(Date);
		expect(await UserModel.countDocuments({ role: "administrator", deletedAt: { $exists: false } })).toBe(1);
	});
});
