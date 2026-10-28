import { AuditLogModel } from "@infrastructure/database/mongodb/models/audit-log.model.js";
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
let mqttClient: ReturnType<typeof createTestApp>["mqttClient"];

beforeAll(async () => {
	await startMongo();
	({ app, mqttClient } = createTestApp(smtp));
}, MONGO_STARTUP_TIMEOUT);

afterAll(stopMongo);

beforeEach(async () => {
	await clearMongo();
	smtp.reset();
	mqttClient.unsubscribe.mockClear();
});

describe("E2E — remoção de dispositivo RF-BE-017", () => {
	it("gestor remove dispositivo e registra auditoria após cancelar o tópico MQTT", async () => {
		const manager = await seedUser({ role: "manager" });
		const agent = request.agent(app);
		await agent
			.post("/api/user/login")
			.send({ email: manager.user.email.value, password: manager.password })
			.expect(200);
		await DeviceModel.create({
			_id: "AA:BB:CC:DD:EE:40",
			name: "Sensor a remover",
			deviceStatus: "online",
			monitoringStatus: "enabled",
		});

		const response = await agent
			.delete("/api/device/delete")
			.send({ deviceId: "AA:BB:CC:DD:EE:40" });

		expect(response.status).toBe(200);
		expect(response.body).toEqual({
			message: "Dispositivo excluido com sucesso",
		});
		expect(await DeviceModel.findById("AA:BB:CC:DD:EE:40")).toBeNull();
		expect(mqttClient.unsubscribe).toHaveBeenCalledWith(
			"device/AA:BB:CC:DD:EE:40/*",
		);
		expect(
			await AuditLogModel.findOne({ resourceId: "AA:BB:CC:DD:EE:40" }),
		).toMatchObject({
			action: "delete",
			actorId: manager.user.id,
			resourceType: "device",
		});
	});
});
