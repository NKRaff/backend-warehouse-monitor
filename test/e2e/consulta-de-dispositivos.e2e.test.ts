import { DeviceModel } from "@infrastructure/database/mongodb/models/device.model.js";
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
beforeEach(clearMongo);

describe("E2E — consulta de dispositivos RF-BE-018", () => {
	it("operador lista e consulta dados do dispositivo autenticado", async () => {
		const operator = await seedUser({ role: "operator" });
		const agent = request.agent(app);
		await agent
			.post("/api/user/login")
			.send({ email: operator.user.email.value, password: operator.password })
			.expect(200);
		await DeviceModel.create({
			_id: "AA:BB:CC:DD:EE:60",
			name: "Sensor sala fria",
			warehouseId: "0190f1a0-7b00-7000-8000-000000000060",
			lastMeasurementId: {
				humidityId: "0190f1a0-7b00-7000-8000-000000000061",
				temperatureId: "0190f1a0-7b00-7000-8000-000000000061",
			},
			deviceStatus: "online",
			monitoringStatus: "enabled",
		});

		const listResponse = await agent
			.get("/api/device")
			.query({ offSet: 0, limit: 10 });
		const deviceResponse = await agent.get("/api/device/AA:BB:CC:DD:EE:60");
		const expectedDevice = {
			mac: "AA:BB:CC:DD:EE:60",
			name: "Sensor sala fria",
			warehouseId: "0190f1a0-7b00-7000-8000-000000000060",
			lastMeasurementId: {
				humidityId: "0190f1a0-7b00-7000-8000-000000000061",
				temperatureId: "0190f1a0-7b00-7000-8000-000000000061",
			},
			deviceStatus: "online",
			monitoringStatus: "enabled",
		};

		expect(listResponse.status).toBe(200);
		expect(listResponse.body).toEqual({
			message: "Lista de dispositivos encontrada",
			devices: [expectedDevice],
		});
		expect(deviceResponse.status).toBe(200);
		expect(deviceResponse.body).toEqual({
			message: "Dispositivo encontrado",
			device: expectedDevice,
		});
	});
});
