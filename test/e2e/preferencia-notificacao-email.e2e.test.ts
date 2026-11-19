import { UserModel } from "@infrastructure/database/mongodb/models/user.model.js";
import type { Express } from "express";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
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

describe("E2E — preferência de notificações por e-mail RF-BE-026", () => {
	it("operador autentica, ativa e desativa sua preferência", async () => {
		const operator = await seedUser({ role: "operator" });
		await UserModel.findByIdAndUpdate(operator.user.id, {
			emailVerified: true,
			emailNotification: false,
		});
		const agent = request.agent(app);
		await agent
			.post("/api/user/login")
			.send({ email: operator.user.email.value, password: operator.password })
			.expect(200);

		const activated = await agent.get("/api/user/change-email-notification");
		expect(activated.status).toBe(200);
		expect(activated.body.message).toBe("Recebimento de email Ativado");
		expect(
			(await UserModel.findById(operator.user.id))?.emailNotification,
		).toBe(true);

		const deactivated = await agent.get("/api/user/change-email-notification");
		expect(deactivated.status).toBe(200);
		expect(deactivated.body.message).toBe("Recebimento de email Desativado");
		expect(
			(await UserModel.findById(operator.user.id))?.emailNotification,
		).toBe(false);
	});
});
