import { MeasurementModel } from "@infrastructure/database/mongodb/models/measurement.model.js";
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
const FIND_MEASUREMENTS = "/api/measurement/findAll";
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
	const agent = request.agent(app);
	await agent
		.post("/api/user/login")
		.send({ email: seeded.user.email.value, password: seeded.password })
		.expect(200);
	return agent;
}

describe("POST /api/measurement/findAll — RF-BE-022", () => {
	it.each(["operator", "manager", "administrator"] as const)(
		"permite a %s consultar medições com todos os filtros e paginação",
		async (role) => {
			const agent = await sessionFor(role);
			const startDate = "2026-03-01T08:00:00.000Z";
			const endDate = "2026-03-01T10:00:00.000Z";
			await MeasurementModel.create([
				{
					_id: "measurement-route-early",
					deviceId: "AA:BB:CC:DD:EE:71",
					warehouseId: "0190f1a0-7b00-7000-8000-000000000071",
					type: "temperature",
					value: 4,
					createdAt: new Date(startDate),
				},
				{
					_id: "measurement-route-late",
					deviceId: "AA:BB:CC:DD:EE:71",
					warehouseId: "0190f1a0-7b00-7000-8000-000000000071",
					type: "temperature",
					value: 5,
					createdAt: new Date(endDate),
				},
				{
					_id: "measurement-route-outside",
					deviceId: "AA:BB:CC:DD:EE:71",
					warehouseId: "0190f1a0-7b00-7000-8000-000000000071",
					type: "temperature",
					value: 6,
					createdAt: new Date("2026-03-01T10:00:00.001Z"),
				},
			]);

			const response = await agent.post(FIND_MEASUREMENTS).send({
				filter: {
					deviceId: "AA:BB:CC:DD:EE:71",
					warehouseId: "0190f1a0-7b00-7000-8000-000000000071",
					type: "temperature",
					startDate,
					endDate,
				},
				pagination: { offSet: 0, limit: 1 },
			});

			expect(response.status).toBe(200);
			expect(response.body.measurements).toEqual([
				expect.objectContaining({
					id: "measurement-route-early",
					deviceId: "AA:BB:CC:DD:EE:71",
					warehouseId: "0190f1a0-7b00-7000-8000-000000000071",
					type: "temperature",
					value: 4,
					createdAt: startDate,
				}),
			]);
		},
	);

	it("retorna lista vazia para combinações de filtros sem correspondência", async () => {
		const agent = await sessionFor("operator");

		const response = await agent.post(FIND_MEASUREMENTS).send({
			filter: { deviceId: "AA:BB:CC:DD:EE:99" },
		});

		expect(response.status).toBe(200);
		expect(response.body.measurements).toEqual([]);
	});

	it("rejeita filtros inválidos sem consultar medições", async () => {
		const agent = await sessionFor("operator");

		const response = await agent.post(FIND_MEASUREMENTS).send({
			filter: { deviceId: "mac-inválido", startDate: "data-inválida" },
		});

		expect(response.status).toBe(400);
		expect(response.body).toMatchObject({
			mensagem: "Erro na validação do input",
			erros: [
				expect.objectContaining({ campo: "filter.deviceId", statusCode: 400 }),
				expect.objectContaining({ campo: "filter.startDate", statusCode: 400 }),
			],
		});
	});

	it("exige autenticação", async () => {
		await request(app).post(FIND_MEASUREMENTS).send({ filter: {} }).expect(401);
	});
});
