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

describe("E2E — atualização de armazém RF-BE-012", () => {
	it("gestor atualiza armazem criado e persiste auditoria dos campos", async () => {
		const manager = await seedUser({ role: "manager" });
		const agent = request.agent(app);
		await agent
			.post("/api/user/login")
			.send({ email: manager.user.email.value, password: manager.password })
			.expect(200);

		const created = await agent.post("/api/warehouse/create").send({
			name: "Deposito de teste",
			category: "general",
			condition: "ambient",
		});
		expect(created.status).toBe(201);

		const limits = {
			temperature: { min: 1, max: 9 },
			humidity: { min: 25, max: 65 },
		};
		const response = await agent.patch("/api/warehouse/update-warehouse").send({
			id: created.body.warehouse.id,
			name: "Deposito atualizado",
			description: "Descricao revisada",
			status: "active",
			limits,
		});

		expect(response.status).toBe(200);
		expect(response.body.warehouse).toMatchObject({
			id: created.body.warehouse.id,
			name: "Deposito atualizado",
			description: "Descricao revisada",
			status: "active",
			limits,
		});
		expect(
			await WarehouseModel.findById(created.body.warehouse.id),
		).toMatchObject({
			name: "Deposito atualizado",
			description: "Descricao revisada",
			status: "active",
			limits,
		});
		expect(
			await AuditLogModel.findOne({
				resourceId: created.body.warehouse.id,
				action: "update",
			}),
		).toMatchObject({
			actorId: manager.user.id,
			resourceType: "warehouse",
			metadata: {
				old: { name: "Deposito de teste", status: "inactive" },
				new: {
					name: "Deposito atualizado",
					status: "active",
					description: "Descricao revisada",
				},
			},
		});
	});
});
