import { MeasurementModel } from "@infrastructure/database/mongodb/models/measurement.model.js";
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

describe("E2E — consulta de medições RF-BE-022", () => {
	it("autentica operador e consulta histórico filtrado e paginado", async () => {
		const operator = await seedUser({ role: "operator" });
		const agent = request.agent(app);
		await agent
			.post("/api/user/login")
			.send({ email: operator.user.email.value, password: operator.password })
			.expect(200);

		await MeasurementModel.create([
			{
				_id: "measurement-e2e-1",
				deviceId: "AA:BB:CC:DD:EE:80",
				warehouseId: "0190f1a0-7b00-7000-8000-000000000080",
				type: "humidity",
				value: 50,
				createdAt: new Date("2026-03-01T08:00:00.000Z"),
			},
			{
				_id: "measurement-e2e-2",
				deviceId: "AA:BB:CC:DD:EE:80",
				warehouseId: "0190f1a0-7b00-7000-8000-000000000080",
				type: "humidity",
				value: 55,
				createdAt: new Date("2026-03-01T09:00:00.000Z"),
			},
			{
				_id: "measurement-e2e-other-device",
				deviceId: "AA:BB:CC:DD:EE:81",
				warehouseId: "0190f1a0-7b00-7000-8000-000000000080",
				type: "humidity",
				value: 60,
				createdAt: new Date("2026-03-01T08:30:00.000Z"),
			},
		]);

		const response = await agent.post("/api/measurement/findAll").send({
			filter: {
				deviceId: "AA:BB:CC:DD:EE:80",
				warehouseId: "0190f1a0-7b00-7000-8000-000000000080",
				type: "humidity",
				startDate: "2026-03-01T08:00:00.000Z",
				endDate: "2026-03-01T09:00:00.000Z",
			},
			pagination: { offSet: 1, limit: 1 },
		});

		expect(response.status).toBe(200);
		expect(response.body).toEqual({
			message: expect.any(String),
			measurements: [
				{
					id: "measurement-e2e-2",
					deviceId: "AA:BB:CC:DD:EE:80",
					warehouseId: "0190f1a0-7b00-7000-8000-000000000080",
					type: "humidity",
					value: 55,
					createdAt: "2026-03-01T09:00:00.000Z",
				},
			],
		});
	});
});
