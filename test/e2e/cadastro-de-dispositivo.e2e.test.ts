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

describe("E2E — cadastro de dispositivo RF-BE-015/RF-BE-019", () => {
	it("gestor cadastra dispositivo vinculado e a API persiste o estado inicial", async () => {
		const manager = await seedUser({ role: "manager" });
		const agent = request.agent(app);
		await agent
			.post("/api/user/login")
			.send({ email: manager.user.email.value, password: manager.password })
			.expect(200);

		const response = await agent.post("/api/device/create").send({
			mac: "AA:BB:CC:DD:EF:01",
			name: "Sensor do depósito",
			warehouseId: "0190f1a0-7b00-7000-8000-000000000007",
		});

		expect(response.status).toBe(201);
		expect(response.body.device).toEqual({
			mac: "AA:BB:CC:DD:EF:01",
			name: "Sensor do depósito",
			deviceStatus: "online",
			monitoringStatus: "disabled",
		});
		expect(await DeviceModel.findById("AA:BB:CC:DD:EF:01")).toMatchObject({
			name: "Sensor do depósito",
			warehouseId: "0190f1a0-7b00-7000-8000-000000000007",
			deviceStatus: "online",
			monitoringStatus: "disabled",
		});
	});

	it("impede cadastrar novamente o mesmo MAC", async () => {
		const manager = await seedUser({ role: "manager" });
		const agent = request.agent(app);
		await agent
			.post("/api/user/login")
			.send({ email: manager.user.email.value, password: manager.password })
			.expect(200);

		const device = {
			mac: "AA:BB:CC:DD:EF:02",
			name: "Sensor existente",
		};
		await agent.post("/api/device/create").send(device).expect(201);
		await agent
			.post("/api/device/create")
			.send({ ...device, name: "Outro nome" })
			.expect(409);

		expect(await DeviceModel.countDocuments()).toBe(1);
		expect((await DeviceModel.findById(device.mac))?.name).toBe(device.name);
	});
});
