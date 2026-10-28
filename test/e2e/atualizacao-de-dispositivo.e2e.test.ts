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

beforeEach(async () => {
	await clearMongo();
	smtp.reset();
});

describe("E2E — atualização de dispositivo RF-BE-016", () => {
	it("gestor atualiza vínculo, nome e estados mantendo a última medição", async () => {
		const manager = await seedUser({ role: "manager" });
		const agent = request.agent(app);
		await agent
			.post("/api/user/login")
			.send({ email: manager.user.email.value, password: manager.password })
			.expect(200);
		await DeviceModel.create({
			_id: "AA:BB:CC:DD:EF:10",
			name: "Sensor anterior",
			warehouseId: "0190f1a0-7b00-7000-8000-000000000010",
			lastMeasurementId: "0190f1a0-7b00-7000-8000-000000000011",
			deviceStatus: "online",
			monitoringStatus: "disabled",
		});
		const warehouseId = "0190f1a0-7b00-7000-8000-000000000012";

		const response = await agent.patch("/api/device/update").send({
			mac: "AA:BB:CC:DD:EF:10",
			name: "  Sensor atualizado  ",
			warehouseId,
			deviceStatus: "error",
			monitoringStatus: "enabled",
		});

		expect(response.status).toBe(200);
		expect(response.body.device).toEqual({
			mac: "AA:BB:CC:DD:EF:10",
			name: "Sensor atualizado",
			warehouseId,
			lastMeasurementId: "0190f1a0-7b00-7000-8000-000000000011",
			deviceStatus: "error",
			monitoringStatus: "enabled",
		});
		expect(await DeviceModel.findById("AA:BB:CC:DD:EF:10")).toMatchObject({
			name: "Sensor atualizado",
			warehouseId,
			lastMeasurementId: "0190f1a0-7b00-7000-8000-000000000011",
			deviceStatus: "error",
			monitoringStatus: "enabled",
		});
	});
});
