import type { Express } from "express";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { AuditLogModel } from "@infrastructure/database/mongodb/models/audit-log.model.js";
import { WarehouseModel } from "@infrastructure/database/mongodb/models/warehouse.model.js";
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

describe("E2E — cadastro de armazém RF-BE-011", () => {
	it("gestor cadastra armazém com limites e o sistema mantém persistência e auditoria", async () => {
		const manager = await seedUser({ role: "manager" });
		const agent = request.agent(app);
		await agent
			.post("/api/user/login")
			.send({ email: manager.user.email.value, password: manager.password })
			.expect(200);

		const response = await agent.post("/api/warehouse/create").send({
			name: "Depósito Refrigerado",
			category: "food",
			condition: "cold",
			description: "Insumos médicos",
			limits: {
				temperature: { min: 2, max: 8 },
				humidity: { min: 30, max: 60 },
			},
		});

		expect(response.status).toBe(201);
		const stored = await WarehouseModel.findById(response.body.warehouse.id);
		expect(stored).toMatchObject({
			name: "Depósito Refrigerado",
			description: "Insumos médicos",
			status: "inactive",
		});
		expect(await AuditLogModel.findOne({ resourceId: stored?._id })).toMatchObject({
			actorId: manager.user.id,
			action: "create",
			resourceType: "warehouse",
		});
	});
});
