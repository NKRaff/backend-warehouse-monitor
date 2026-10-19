import type { Express } from "express";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { AuditLogModel } from "@infrastructure/database/mongodb/models/audit-log.model.js";
import { WarehouseModel } from "@infrastructure/database/mongodb/models/warehouse.model.js";
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
const CREATE_WAREHOUSE = "/api/warehouse/create";
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

async function sessionFor(role: "manager" | "administrator" | "operator") {
	const seeded = await seedUser({ role });
	const agent = request.agent(app);
	await agent
		.post("/api/user/login")
		.send({ email: seeded.user.email.value, password: seeded.password })
		.expect(200);
	return { agent, user: seeded.user };
}

const validWarehouse = {
	name: "Câmara Fria",
	category: "food",
	condition: "cold",
	limits: {
		temperature: { min: 2, max: 8 },
		humidity: { min: 30, max: 60 },
	},
};

describe("POST /api/warehouse/create — RF-BE-011", () => {
	it.each(["manager", "administrator"] as const)(
		"permite ao papel %s criar armazém e registra auditoria",
		async (role) => {
			const { agent, user } = await sessionFor(role);

			const response = await agent
				.post(CREATE_WAREHOUSE)
				.send(validWarehouse);

			expect(response.status).toBe(201);
			expect(response.body).toMatchObject({
				message: "Armazém criado com sucesso",
				warehouse: {
					name: "Câmara Fria",
					category: "food",
					condition: "cold",
					limits: validWarehouse.limits,
				},
			});
			const stored = await WarehouseModel.findById(response.body.warehouse.id);
			expect(stored).toMatchObject({
				name: "Câmara Fria",
				status: "inactive",
				description: "No description",
			});
			expect(await AuditLogModel.findOne({ resourceId: stored?._id })).toMatchObject({
				actorId: user.id,
				action: "create",
				resourceType: "warehouse",
			});
		},
	);

	it("exige autenticação", async () => {
		await request(app).post(CREATE_WAREHOUSE).send(validWarehouse).expect(401);
		expect(await WarehouseModel.countDocuments()).toBe(0);
	});

	it("nega criação ao papel operator conforme a matriz atual", async () => {
		const { agent } = await sessionFor("operator");

		await agent.post(CREATE_WAREHOUSE).send(validWarehouse).expect(403);
		expect(await WarehouseModel.countDocuments()).toBe(0);
	});

	it("rejeita corpo inválido sem criar armazém", async () => {
		const { agent } = await sessionFor("manager");

		const response = await agent
			.post(CREATE_WAREHOUSE)
			.send({ ...validWarehouse, category: "other" });

		expect(response.status).toBe(400);
		expect(response.body.erros).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ campo: "category" }),
			]),
		);
		expect(await WarehouseModel.countDocuments()).toBe(0);
	});

	it("rejeita limites inconsistentes sem persistir", async () => {
		const { agent } = await sessionFor("manager");

		const response = await agent
			.post(CREATE_WAREHOUSE)
			.send({
				...validWarehouse,
				limits: {
					temperature: { min: 8, max: 2 },
					humidity: { min: 30, max: 60 },
				},
			});

		expect(response.status).toBe(422);
		expect(await WarehouseModel.countDocuments()).toBe(0);
	});

	it("rejeita nome duplicado e preserva o primeiro registro", async () => {
		const { agent } = await sessionFor("manager");
		await agent.post(CREATE_WAREHOUSE).send(validWarehouse).expect(201);

		const response = await agent.post(CREATE_WAREHOUSE).send(validWarehouse);

		expect(response.status).toBe(409);
		expect(await WarehouseModel.countDocuments({ name: validWarehouse.name })).toBe(1);
		expect(
			await AuditLogModel.countDocuments({ resourceType: "warehouse" }),
		).toBe(1);
	});
});
