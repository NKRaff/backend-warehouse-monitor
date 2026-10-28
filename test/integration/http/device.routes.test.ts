import { AuditLogModel } from "@infrastructure/database/mongodb/models/audit-log.model.js";
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
const UPDATE_DEVICE = "/api/device/update";
const DELETE_DEVICE = "/api/device/delete";
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
	mqttClient?.unsubscribe.mockClear();
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

	it("nega o cadastro a operador, que tem acesso somente de leitura", async () => {
		const agent = await sessionFor("operator");

		await agent
			.post(CREATE_DEVICE)
			.send({ mac: "AA:BB:CC:DD:EE:06", name: "Sensor válido" })
			.expect(403);
		expect(await DeviceModel.countDocuments()).toBe(0);
	});
});

describe("PATCH /api/device/update — RF-BE-016", () => {
	const storedDevice = {
		_id: "AA:BB:CC:DD:EE:20",
		name: "Sensor antigo",
		warehouseId: "0190f1a0-7b00-7000-8000-000000000020",
		lastMeasurementId: "0190f1a0-7b00-7000-8000-000000000021",
		deviceStatus: "online" as const,
		monitoringStatus: "disabled" as const,
	};

	it("atualiza os campos enviados e preserva os demais", async () => {
		const agent = await sessionFor("manager");
		await DeviceModel.create(storedDevice);
		const newWarehouseId = "0190f1a0-7b00-7000-8000-000000000022";

		const response = await agent.patch(UPDATE_DEVICE).send({
			mac: storedDevice._id,
			name: "  Sensor atualizado  ",
			warehouseId: newWarehouseId,
			deviceStatus: "error",
			monitoringStatus: "enabled",
		});

		expect(response.status).toBe(200);
		expect(response.body).toEqual({
			message: "Dispositivo atualizado com sucesso",
			device: {
				mac: storedDevice._id,
				name: "Sensor atualizado",
				warehouseId: newWarehouseId,
				lastMeasurementId: storedDevice.lastMeasurementId,
				deviceStatus: "error",
				monitoringStatus: "enabled",
			},
		});
		expect(await DeviceModel.findById(storedDevice._id)).toMatchObject({
			...storedDevice,
			name: "Sensor atualizado",
			warehouseId: newWarehouseId,
			deviceStatus: "error",
			monitoringStatus: "enabled",
		});
	});

	it("atualiza somente o nome e mantém vínculo e status anteriores", async () => {
		const agent = await sessionFor("administrator");
		await DeviceModel.create(storedDevice);

		await agent
			.patch(UPDATE_DEVICE)
			.send({ mac: storedDevice._id, name: "Sensor novo" })
			.expect(200);

		expect(await DeviceModel.findById(storedDevice._id)).toMatchObject({
			...storedDevice,
			name: "Sensor novo",
		});
	});

	it("retorna 404 para dispositivo inexistente", async () => {
		const agent = await sessionFor("manager");

		await agent
			.patch(UPDATE_DEVICE)
			.send({ mac: "AA:BB:CC:DD:EE:21", name: "Sensor novo" })
			.expect(404);
		expect(await DeviceModel.countDocuments()).toBe(0);
	});

	it("rejeita nome curto após normalização sem alterar o documento", async () => {
		const agent = await sessionFor("manager");
		await DeviceModel.create(storedDevice);

		await agent
			.patch(UPDATE_DEVICE)
			.send({ mac: storedDevice._id, name: "  a " })
			.expect(400);
		expect((await DeviceModel.findById(storedDevice._id))?.name).toBe(
			storedDevice.name,
		);
	});

	it.each([
		{ mac: "MAC-inválido", name: "Sensor válido" },
		{ mac: storedDevice._id, name: "abc" },
		{ mac: storedDevice._id, warehouseId: "warehouse-inválido" },
		{ mac: storedDevice._id, deviceStatus: "unknown" },
		{ mac: storedDevice._id, monitoringStatus: "unknown" },
	])("rejeita campos inválidos antes de atualizar: $mac", async (body) => {
		const agent = await sessionFor("manager");
		await DeviceModel.create(storedDevice);

		await agent.patch(UPDATE_DEVICE).send(body).expect(400);
		expect(await DeviceModel.findById(storedDevice._id)).toMatchObject(
			storedDevice,
		);
	});

	it("exige autenticação", async () => {
		await request(app)
			.patch(UPDATE_DEVICE)
			.send({ mac: storedDevice._id, name: "Sensor novo" })
			.expect(401);
	});

	it("nega atualização a operador, que tem acesso somente de leitura", async () => {
		const agent = await sessionFor("operator");
		await DeviceModel.create(storedDevice);

		await agent
			.patch(UPDATE_DEVICE)
			.send({ mac: storedDevice._id, name: "Sensor novo" })
			.expect(403);
		expect((await DeviceModel.findById(storedDevice._id))?.name).toBe(
			storedDevice.name,
		);
	});
});

describe("DELETE /api/device/delete — RF-BE-017", () => {
	const storedDevice = {
		_id: "AA:BB:CC:DD:EE:30",
		name: "Sensor a remover",
		deviceStatus: "online" as const,
		monitoringStatus: "enabled" as const,
	};

	it.each(["manager", "administrator"] as const)(
		"permite que %s remova dispositivo, cancele o tópico e audite a ação",
		async (role) => {
			const agent = await sessionFor(role);
			await DeviceModel.create(storedDevice);

			const response = await agent
				.delete(DELETE_DEVICE)
				.send({ deviceId: storedDevice._id });

			expect(response.status).toBe(200);
			expect(response.body).toEqual({
				message: "Dispositivo excluido com sucesso",
			});
			expect(await DeviceModel.findById(storedDevice._id)).toBeNull();
			expect(mqttClient.unsubscribe).toHaveBeenCalledWith(
				`device/${storedDevice._id}/*`,
			);
			expect(await AuditLogModel.findOne({ resourceId: storedDevice._id })).toMatchObject({
				action: "delete",
				actorId: expect.stringMatching(/^seed-user-/),
				resourceType: "device",
			});
		},
	);

	it("exige autenticação", async () => {
		await request(app)
			.delete(DELETE_DEVICE)
			.send({ deviceId: storedDevice._id })
			.expect(401);
	});

	it("nega exclusão a operador, que pode apenas consultar dispositivos", async () => {
		const agent = await sessionFor("operator");
		await DeviceModel.create(storedDevice);

		await agent
			.delete(DELETE_DEVICE)
			.send({ deviceId: storedDevice._id })
			.expect(403);

		expect(await DeviceModel.findById(storedDevice._id)).not.toBeNull();
		expect(mqttClient.unsubscribe).not.toHaveBeenCalled();
	});

	it("rejeita MAC inválido sem alterar dados", async () => {
		const agent = await sessionFor("manager");
		await DeviceModel.create(storedDevice);

		await agent.delete(DELETE_DEVICE).send({ deviceId: "id-inválido" }).expect(400);

		expect(await DeviceModel.findById(storedDevice._id)).not.toBeNull();
		expect(mqttClient.unsubscribe).not.toHaveBeenCalled();
	});

	it("retorna 404 quando o dispositivo não existe", async () => {
		const agent = await sessionFor("manager");

		await agent
			.delete(DELETE_DEVICE)
			.send({ deviceId: storedDevice._id })
			.expect(404);

		expect(
			await AuditLogModel.countDocuments({ resourceId: storedDevice._id }),
		).toBe(0);
		expect(mqttClient.unsubscribe).not.toHaveBeenCalled();
	});
});
