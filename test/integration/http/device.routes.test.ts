import { DeviceModel } from "@infrastructure/database/mongodb/models/device.model.js";
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
const CREATE_DEVICE = "/api/device/create";
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
	return agent;
}

describe("POST /api/device/create — RF-BE-015/RF-BE-019", () => {
	it.each(["manager", "administrator"] as const)(
		"permite a %s cadastrar dispositivo sem armazém",
		async (role) => {
			const agent = await sessionFor(role);

			const response = await agent.post(CREATE_DEVICE).send({
				mac: "AA:BB:CC:DD:EE:FF",
				name: "  Sensor câmara  ",
			});

			expect(response.status).toBe(201);
			expect(response.body).toEqual({
				message: "Dispositivo cadastrato com sucesso",
				device: {
					mac: "AA:BB:CC:DD:EE:FF",
					name: "Sensor câmara",
					deviceStatus: "online",
					monitoringStatus: "disabled",
				},
			});
			expect(await DeviceModel.findById("AA:BB:CC:DD:EE:FF")).toMatchObject({
				_id: "AA:BB:CC:DD:EE:FF",
				name: "Sensor câmara",
				deviceStatus: "online",
				monitoringStatus: "disabled",
			});
		},
	);

	it("persiste o vínculo opcional informado", async () => {
		const agent = await sessionFor("manager");
		const warehouseId = "0190f1a0-7b00-7000-8000-000000000005";

		await agent
			.post(CREATE_DEVICE)
			.send({
				mac: "AA:BB:CC:DD:EE:01",
				name: "Sensor vinculado",
				warehouseId,
			})
			.expect(201);

		expect((await DeviceModel.findById("AA:BB:CC:DD:EE:01"))?.warehouseId).toBe(
			warehouseId,
		);
	});

	it("rejeita MAC duplicado sem substituir o registro existente", async () => {
		const agent = await sessionFor("manager");
		await DeviceModel.create({
			_id: "AA:BB:CC:DD:EE:02",
			name: "Sensor existente",
			deviceStatus: "online",
			monitoringStatus: "disabled",
		});

		const response = await agent.post(CREATE_DEVICE).send({
			mac: "AA:BB:CC:DD:EE:02",
			name: "Sensor duplicado",
		});

		expect(response.status).toBe(409);
		expect((await DeviceModel.findById("AA:BB:CC:DD:EE:02"))?.name).toBe(
			"Sensor existente",
		);
	});

	it.each([
		{ mac: "MAC-inválido", name: "Sensor válido" },
		{ mac: "AA:BB:CC:DD:EE:03", name: "abc" },
		{
			mac: "AA:BB:CC:DD:EE:04",
			name: "Sensor válido",
			warehouseId: "warehouse-inválido",
		},
	])("rejeita entrada inválida: $mac", async (body) => {
		const agent = await sessionFor("manager");

		await agent.post(CREATE_DEVICE).send(body).expect(400);
		expect(await DeviceModel.countDocuments()).toBe(0);
	});

	it("exige autenticação", async () => {
		await request(app)
			.post(CREATE_DEVICE)
			.send({ mac: "AA:BB:CC:DD:EE:05", name: "Sensor válido" })
			.expect(401);
	});

	it("nega o cadastro a operador segundo a matriz atual", async () => {
		const agent = await sessionFor("operator");

		await agent
			.post(CREATE_DEVICE)
			.send({ mac: "AA:BB:CC:DD:EE:06", name: "Sensor válido" })
			.expect(403);
		expect(await DeviceModel.countDocuments()).toBe(0);
	});
});
