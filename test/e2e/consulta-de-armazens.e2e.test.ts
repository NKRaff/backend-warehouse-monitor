import type { Express } from "express";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { WarehouseModel } from "@infrastructure/database/mongodb/models/warehouse.model.js";
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
beforeEach(async () => {
	await clearMongo();
	smtp.reset();
});

describe("E2E — consulta de armazéns RF-BE-014", () => {
	it("usuário autenticado lista ambientes ativos em páginas e consulta um ambiente", async () => {
		const operator = await seedUser({ role: "operator" });
		const agent = request.agent(app);
		await agent.post("/api/user/login").send({
			email: operator.user.email.value,
			password: operator.password,
		}).expect(200);

		await WarehouseModel.create([
			{ _id: "0190f1a0-7b00-7000-8000-000000000011", name: "Depósito Norte", category: "food", condition: "cold", status: "active", description: "Estoque refrigerado" },
			{ _id: "0190f1a0-7b00-7000-8000-000000000012", name: "Depósito Sul", category: "food", condition: "cold", status: "inactive", description: "Estoque seco" },
			{ _id: "0190f1a0-7b00-7000-8000-000000000013", name: "Depósito Removido", category: "food", condition: "cold", status: "inactive", description: "Removido", deletedAt: new Date() },
		]);

		const page = await agent.get("/api/warehouse/warehouses/").query({ offSet: 0, limit: 1 }).expect(200);
		const secondPage = await agent.get("/api/warehouse/warehouses/").query({ offSet: 1, limit: 1 }).expect(200);
		expect(page.body.warehouses).toHaveLength(1);
		expect(secondPage.body.warehouses).toHaveLength(1);
		expect([page.body.warehouses[0].id, secondPage.body.warehouses[0].id]).toEqual(expect.arrayContaining([
			"0190f1a0-7b00-7000-8000-000000000011",
			"0190f1a0-7b00-7000-8000-000000000012",
		]));
		expect(page.body.warehouses[0].id).not.toBe("0190f1a0-7b00-7000-8000-000000000013");
		expect(secondPage.body.warehouses[0].id).not.toBe("0190f1a0-7b00-7000-8000-000000000013");

		const detail = await agent.get("/api/warehouse/0190f1a0-7b00-7000-8000-000000000011").expect(200);
		expect(detail.body.warehouse).toMatchObject({
			id: "0190f1a0-7b00-7000-8000-000000000011",
			name: "Depósito Norte",
			description: "Estoque refrigerado",
		});
	});
});
