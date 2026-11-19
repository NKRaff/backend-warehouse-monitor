import { UserModel } from "@infrastructure/database/mongodb/models/user.model.js";
import type { Express } from "express";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { FakeSmtpClient } from "../../helpers/fake-smtp.js";
import {
	clearMongo,
	MONGO_STARTUP_TIMEOUT,
	startMongo,
	stopMongo,
} from "../../helpers/mongo.js";
import { seedUser } from "../../helpers/seed.js";
import { createTestApp } from "../../helpers/test-app.js";

const smtp = new FakeSmtpClient();
const CHANGE_EMAIL_NOTIFICATION = "/api/user/change-email-notification";
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

async function sessionFor(role: "operator" | "manager" | "administrator") {
	const seeded = await seedUser({ role });
	await UserModel.findByIdAndUpdate(seeded.user.id, {
		emailVerified: true,
		emailNotification: false,
	});
	const agent = request.agent(app);
	await agent
		.post("/api/user/login")
		.send({ email: seeded.user.email.value, password: seeded.password })
		.expect(200);
	return { agent, userId: seeded.user.id };
}

describe("GET /api/user/change-email-notification — RF-BE-026", () => {
	it.each(["operator", "manager", "administrator"] as const)(
		"permite a %s ativar e desativar a própria preferência persistida",
		async (role) => {
			const { agent, userId } = await sessionFor(role);

			const enabled = await agent.get(CHANGE_EMAIL_NOTIFICATION);
			expect(enabled.status).toBe(200);
			expect(enabled.body.message).toBe("Recebimento de email Ativado");
			expect((await UserModel.findById(userId))?.emailNotification).toBe(true);

			const disabled = await agent.get(CHANGE_EMAIL_NOTIFICATION);
			expect(disabled.status).toBe(200);
			expect(disabled.body.message).toBe("Recebimento de email Desativado");
			expect((await UserModel.findById(userId))?.emailNotification).toBe(false);
		},
	);

	it("mantém desativada a preferência enquanto o e-mail não foi verificado", async () => {
		const seeded = await seedUser({ role: "operator" });
		const agent = request.agent(app);
		await agent
			.post("/api/user/login")
			.send({ email: seeded.user.email.value, password: seeded.password })
			.expect(200);

		const response = await agent.get(CHANGE_EMAIL_NOTIFICATION);

		expect(response.status).toBe(200);
		expect(response.body.message).toBe("Recebimento de email Desativado");
		expect((await UserModel.findById(seeded.user.id))?.emailNotification).toBe(
			false,
		);
	});

	it("exige autenticação", async () => {
		await request(app).get(CHANGE_EMAIL_NOTIFICATION).expect(401);
	});

	it("nega acesso a usuário removido após autenticar", async () => {
		const { agent, userId } = await sessionFor("operator");
		await UserModel.findByIdAndUpdate(userId, { deletedAt: new Date() });

		await agent.get(CHANGE_EMAIL_NOTIFICATION).expect(403);
		expect((await UserModel.findById(userId))?.emailNotification).toBe(false);
	});
});
