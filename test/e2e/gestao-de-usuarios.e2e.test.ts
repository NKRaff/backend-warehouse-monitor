import type { Express } from "express";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { AuditLogModel } from "@infrastructure/database/mongodb/models/audit-log.model.js";
import { TokenModel } from "@infrastructure/database/mongodb/models/token.model.js";
import { UserModel } from "@infrastructure/database/mongodb/models/user.model.js";
import { FakeSmtpClient } from "../helpers/fake-smtp.js";
import { clearMongo, MONGO_STARTUP_TIMEOUT, startMongo, stopMongo } from "../helpers/mongo.js";
import { seedUser } from "../helpers/seed.js";
import { createTestApp } from "../helpers/test-app.js";

const smtp = new FakeSmtpClient();
let app: Express;
beforeAll(async () => {
	await startMongo();
	({ app } = createTestApp(smtp));
}, MONGO_STARTUP_TIMEOUT);
afterAll(stopMongo);
beforeEach(async () => { await clearMongo(); smtp.reset(); });

describe("E2E — gestão de usuários RF-BE-008/RF-BE-009", () => {
	it("administra um usuário: edita, promove e remove, mantendo auditoria e encerrando tokens", async () => {
		const admin = await seedUser({ role: "administrator" });
		const target = await seedUser({ role: "operator" });
		const agent = request.agent(app);
		await agent.post("/api/user/login").send({ email: admin.user.email.value, password: admin.password }).expect(200);

		await agent.patch("/api/user/update_user").send({ userId: target.user.id, name: "Carlos Atualizado", email: "carlos.atualizado@empresa.com" }).expect(200);
		await agent.patch("/api/user/change-role").send({ userId: target.user.id, role: "manager" }).expect(200);
		await TokenModel.create({ _id: "target-token", userId: target.user.id, type: "refresh", valueHash: "hashed-value", expiresAt: new Date(Date.now() + 60_000) });
		await agent.delete("/api/user/delete_user").send({ userId: target.user.id }).expect(200);

		expect(await UserModel.findById(target.user.id)).toMatchObject({ name: "Carlos Atualizado", email: "carlos.atualizado@empresa.com", role: "manager", deletedAt: expect.any(Date) });
		expect(await TokenModel.countDocuments({ userId: target.user.id })).toBe(0);
		expect(await AuditLogModel.countDocuments({ resourceId: target.user.id })).toBe(3);
	});

	it("impede operador de alterar papel ou remover usuário", async () => {
		const operator = await seedUser({ role: "operator" });
		const target = await seedUser({ role: "manager" });
		const agent = request.agent(app);
		await agent.post("/api/user/login").send({ email: operator.user.email.value, password: operator.password }).expect(200);
		await agent.patch("/api/user/change-role").send({ userId: target.user.id, role: "administrator" }).expect(403);
		await agent.delete("/api/user/delete_user").send({ userId: target.user.id }).expect(403);
		expect((await UserModel.findById(target.user.id))?.deletedAt).toBeUndefined();
	});
});
