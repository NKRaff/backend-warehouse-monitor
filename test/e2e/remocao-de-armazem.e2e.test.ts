import type { Express } from "express";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { AuditLogModel } from "@infrastructure/database/mongodb/models/audit-log.model.js";
import { DeviceModel } from "@infrastructure/database/mongodb/models/device.model.js";
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

describe("E2E — remoção de armazém RF-BE-013", () => {
	it("gestor remove armazém logicamente e a ação fica auditada", async () => {
		const manager = await seedUser({ role: "manager" });
		const agent = request.agent(app);
		await agent
			.post("/api/user/login")
			.send({ email: manager.user.email.value, password: manager.password })
			.expect(200);

		const created = await agent.post("/api/warehouse/create").send({
			name: "Depósito para Remoção",
			category: "general",
			condition: "ambient",
		});
		expect(created.status).toBe(201);
		await DeviceModel.create({
			_id: "AA:BB:CC:DD:EE:FF",
			name: "Sensor vinculado",
			warehouseId: created.body.warehouse.id,
			lastMeasurementId: "measurement-1",
			deviceStatus: "online",
			monitoringStatus: "enabled",
		});

		const response = await agent
			.delete("/api/warehouse/delete-warehouse")
			.send({ warehouseId: created.body.warehouse.id });

		expect(response.status).toBe(200);
		const stored = await WarehouseModel.findById(created.body.warehouse.id);
		expect(stored?.deletedAt).toBeInstanceOf(Date);
		expect(stored).toMatchObject({
			name: "Depósito para Remoção",
			status: "inactive",
		});
		const device = await DeviceModel.findById("AA:BB:CC:DD:EE:FF");
		expect(device?.warehouseId).toBeUndefined();
		expect(device?.deviceStatus).toBe("offline");
		expect(device?.monitoringStatus).toBe("enabled");
		expect(
			await AuditLogModel.findOne({
				resourceId: created.body.warehouse.id,
				action: "delete",
			}),
		).toMatchObject({
			actorId: manager.user.id,
			resourceType: "warehouse",
		});
	});
});
