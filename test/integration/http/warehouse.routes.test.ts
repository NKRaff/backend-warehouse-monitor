import { AuditLogModel } from "@infrastructure/database/mongodb/models/audit-log.model.js";
import { WarehouseModel } from "@infrastructure/database/mongodb/models/warehouse.model.js";
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
const CREATE_WAREHOUSE = "/api/warehouse/create";
const DELETE_WAREHOUSE = "/api/warehouse/delete-warehouse";
const UPDATE_WAREHOUSE = "/api/warehouse/update-warehouse";
const GET_WAREHOUSE = "/api/warehouse";
const LIST_WAREHOUSES = "/api/warehouse/warehouses/";
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

			const response = await agent.post(CREATE_WAREHOUSE).send(validWarehouse);

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
			expect(
				await AuditLogModel.findOne({ resourceId: stored?._id }),
			).toMatchObject({
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
			expect.arrayContaining([expect.objectContaining({ campo: "category" })]),
		);
		expect(await WarehouseModel.countDocuments()).toBe(0);
	});

	it("rejeita limites inconsistentes sem persistir", async () => {
		const { agent } = await sessionFor("manager");

		const response = await agent.post(CREATE_WAREHOUSE).send({
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
		expect(
			await WarehouseModel.countDocuments({ name: validWarehouse.name }),
		).toBe(1);
		expect(
			await AuditLogModel.countDocuments({ resourceType: "warehouse" }),
		).toBe(1);
	});
});

async function seedWarehouse(id = "warehouse-1") {
	return WarehouseModel.create({
		_id: id,
		name: "Câmara Fria",
		category: "food",
		condition: "cold",
		status: "inactive",
		description: "Armazenamento refrigerado",
	});
}

describe("DELETE /api/warehouse/delete-warehouse — RF-BE-013", () => {
	it.each(["manager", "administrator"] as const)(
		"permite ao papel %s remover logicamente o armazém e registra auditoria",
		async (role) => {
			const { agent, user } = await sessionFor(role);
			const warehouse = await seedWarehouse();

			const response = await agent
				.delete(DELETE_WAREHOUSE)
				.send({ warehouseId: warehouse._id });

			expect(response.status).toBe(200);
			expect(response.body).toEqual({
				message: "Armazém excluido com sucesso",
			});
			const stored = await WarehouseModel.findById(warehouse._id);
			expect(stored?.deletedAt).toBeInstanceOf(Date);
			expect(stored).toMatchObject({
				name: warehouse.name,
				category: warehouse.category,
				condition: warehouse.condition,
			});
			expect(
				await AuditLogModel.findOne({
					resourceId: warehouse._id,
					action: "delete",
				}),
			).toMatchObject({
				actorId: user.id,
				resourceType: "warehouse",
			});
		},
	);

	it("exige autenticação e não altera o armazém", async () => {
		const warehouse = await seedWarehouse();

		await request(app)
			.delete(DELETE_WAREHOUSE)
			.send({ warehouseId: warehouse._id })
			.expect(401);

		expect(
			(await WarehouseModel.findById(warehouse._id))?.deletedAt,
		).toBeUndefined();
		expect(await AuditLogModel.countDocuments({ action: "delete" })).toBe(0);
	});

	it("nega operador conforme a matriz atual e preserva o armazém", async () => {
		const { agent } = await sessionFor("operator");
		const warehouse = await seedWarehouse();

		await agent
			.delete(DELETE_WAREHOUSE)
			.send({ warehouseId: warehouse._id })
			.expect(403);

		expect(
			(await WarehouseModel.findById(warehouse._id))?.deletedAt,
		).toBeUndefined();
		expect(await AuditLogModel.countDocuments({ action: "delete" })).toBe(0);
	});

	it("rejeita payload inválido sem remover ou auditar", async () => {
		const { agent } = await sessionFor("manager");
		const warehouse = await seedWarehouse();

		const response = await agent
			.delete(DELETE_WAREHOUSE)
			.send({ warehouseId: 123 });

		expect(response.status).toBe(400);
		expect(response.body.erros).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ campo: "warehouseId" }),
			]),
		);
		expect(
			(await WarehouseModel.findById(warehouse._id))?.deletedAt,
		).toBeUndefined();
		expect(await AuditLogModel.countDocuments({ action: "delete" })).toBe(0);
	});
});

describe("PATCH /api/warehouse/update-warehouse — RF-BE-012", () => {
	it.each(["manager", "administrator"] as const)(
		"permite ao papel %s atualizar parcialmente e registra auditoria",
		async (role) => {
			const { agent, user } = await sessionFor(role);
			const warehouse = await seedWarehouse();
			const oldLimits = {
				temperature: { min: 2, max: 8 },
				humidity: { min: 30, max: 60 },
			};
			await WarehouseModel.findByIdAndUpdate(warehouse._id, {
				limits: oldLimits,
			});
			const limits = {
				temperature: { min: 1, max: 9 },
				humidity: { min: 25, max: 65 },
			};

			const response = await agent.patch(UPDATE_WAREHOUSE).send({
				id: warehouse._id,
				name: "  Câmara Atualizada  ",
				status: "active",
				limits,
			});

			expect(response.status).toBe(200);
			expect(response.body).toMatchObject({
				message: "Armazém atualizado com sucesso",
				warehouse: {
					id: warehouse._id,
					name: "Câmara Atualizada",
					status: "active",
					condition: "cold",
					category: "food",
					description: "Armazenamento refrigerado",
					limits,
				},
			});
			expect(await WarehouseModel.findById(warehouse._id)).toMatchObject({
				name: "Câmara Atualizada",
				status: "active",
				limits,
			});
			expect(
				await AuditLogModel.findOne({
					resourceId: warehouse._id,
					action: "update",
				}),
			).toMatchObject({
				actorId: user.id,
				resourceType: "warehouse",
				metadata: {
					old: expect.objectContaining({
						name: warehouse.name,
						status: "inactive",
						limits: oldLimits,
					}),
					new: expect.objectContaining({
						name: "Câmara Atualizada",
						status: "active",
						limits,
					}),
				},
			});
		},
	);

	it("exige autenticacao", async () => {
		const warehouse = await seedWarehouse();

		await request(app)
			.patch(UPDATE_WAREHOUSE)
			.send({ id: warehouse._id, name: "Câmara Atualizada" })
			.expect(401);

		expect((await WarehouseModel.findById(warehouse._id))?.name).toBe(
			warehouse.name,
		);
		expect(await AuditLogModel.countDocuments({ action: "update" })).toBe(0);
	});

	it("nega operador conforme a matriz atual sem alterar o armazem", async () => {
		const { agent } = await sessionFor("operator");
		const warehouse = await seedWarehouse();

		await agent
			.patch(UPDATE_WAREHOUSE)
			.send({ id: warehouse._id, name: "Câmara Atualizada" })
			.expect(403);

		expect((await WarehouseModel.findById(warehouse._id))?.name).toBe(
			warehouse.name,
		);
		expect(await AuditLogModel.countDocuments({ action: "update" })).toBe(0);
	});

	it("rejeita campos invalidos sem persistir ou auditar", async () => {
		const { agent } = await sessionFor("manager");
		const warehouse = await seedWarehouse();

		const response = await agent
			.patch(UPDATE_WAREHOUSE)
			.send({ id: warehouse._id, category: "misc" });

		expect(response.status).toBe(400);
		expect(response.body.erros).toEqual(
			expect.arrayContaining([expect.objectContaining({ campo: "category" })]),
		);
		expect((await WarehouseModel.findById(warehouse._id))?.category).toBe(
			warehouse.category,
		);
		expect(await AuditLogModel.countDocuments({ action: "update" })).toBe(0);
	});

	it("rejeita atualizacao sem campos", async () => {
		const { agent } = await sessionFor("manager");
		const warehouse = await seedWarehouse();

		const response = await agent
			.patch(UPDATE_WAREHOUSE)
			.send({ id: warehouse._id });

		expect(response.status).toBe(422);
		expect((await WarehouseModel.findById(warehouse._id))?.name).toBe(
			warehouse.name,
		);
		expect(await AuditLogModel.countDocuments({ action: "update" })).toBe(0);
	});

	it("rejeita limites inconsistentes sem persistir", async () => {
		const { agent } = await sessionFor("manager");
		const warehouse = await seedWarehouse();

		const response = await agent.patch(UPDATE_WAREHOUSE).send({
			id: warehouse._id,
			limits: {
				temperature: { min: 8, max: 2 },
				humidity: { min: 30, max: 60 },
			},
		});

		expect(response.status).toBe(422);
		expect(
			(await WarehouseModel.findById(warehouse._id))?.limits,
		).toBeUndefined();
		expect(await AuditLogModel.countDocuments({ action: "update" })).toBe(0);
	});

	it("retorna nao encontrado para id inexistente sem auditar", async () => {
		const { agent } = await sessionFor("manager");

		await agent
			.patch(UPDATE_WAREHOUSE)
			.send({ id: "warehouse-missing", name: "Câmara Atualizada" })
			.expect(404);

		expect(await AuditLogModel.countDocuments({ action: "update" })).toBe(0);
	});

	it("RF-BE-012: rejeita armazem removido como indisponivel para edicao", async () => {
		const { agent } = await sessionFor("manager");
		const warehouse = await seedWarehouse();
		await WarehouseModel.findByIdAndUpdate(warehouse._id, {
			deletedAt: new Date(),
		});

		// Defeito conhecido: findById no repositório inclui armazéns removidos.
		await agent
			.patch(UPDATE_WAREHOUSE)
			.send({ id: warehouse._id, name: "Câmara Atualizada" })
			.expect(404);
	});

	it("registra ambas as atualizacoes concorrentes e aplica os campos enviados", async () => {
		const { agent } = await sessionFor("manager");
		const warehouse = await seedWarehouse();

		const [nameUpdate, descriptionUpdate] = await Promise.all([
			agent
				.patch(UPDATE_WAREHOUSE)
				.send({ id: warehouse._id, name: "Câmara Atualizada" }),
			agent
				.patch(UPDATE_WAREHOUSE)
				.send({ id: warehouse._id, description: "Descricao atualizada" }),
		]);

		expect(nameUpdate.status).toBe(200);
		expect(descriptionUpdate.status).toBe(200);
		expect(await WarehouseModel.findById(warehouse._id)).toMatchObject({
			name: "Câmara Atualizada",
			description: "Descricao atualizada",
		});
		expect(
			await AuditLogModel.countDocuments({
				resourceId: warehouse._id,
				action: "update",
			}),
		).toBe(2);
	});
});

describe("GET /api/warehouse/warehouses/ e GET /api/warehouse/:warehouseId — RF-BE-014", () => {
	it("lista somente ambientes ativos, aplica offset/limit da query e inclui descrição", async () => {
		const { agent } = await sessionFor("operator");
		const first = await seedWarehouse("0190f1a0-7b00-7000-8000-000000000001");
		await seedWarehouse("0190f1a0-7b00-7000-8000-000000000002");
		await WarehouseModel.findByIdAndUpdate(first._id, { deletedAt: new Date() });

		const response = await agent.get(LIST_WAREHOUSES).query({ offSet: 0, limit: 1 });

		expect(response.status).toBe(200);
		expect(response.body.warehouses).toHaveLength(1);
		expect(response.body.warehouses[0]).toMatchObject({
			id: "0190f1a0-7b00-7000-8000-000000000002",
			name: "Câmara Fria",
			description: "Armazenamento refrigerado",
		});
	});

	it("retorna lista vazia sem erro quando não há ambientes ativos", async () => {
		const { agent } = await sessionFor("operator");

		const response = await agent.get(LIST_WAREHOUSES).query({ offSet: 0, limit: 10 });

		expect(response.status).toBe(200);
		expect(response.body.warehouses).toEqual([]);
	});

	it("exige autenticação para listar", async () => {
		await request(app).get(LIST_WAREHOUSES).query({ offSet: 0, limit: 10 }).expect(401);
	});

	it("rejeita paginação ausente ou não numérica", async () => {
		const { agent } = await sessionFor("operator");

		await agent.get(LIST_WAREHOUSES).query({ offSet: "inválido", limit: 10 }).expect(400);
		await agent.get(LIST_WAREHOUSES).expect(400);
	});

	it("retorna os dados de um ambiente consultado por UUID v7", async () => {
		const { agent } = await sessionFor("operator");
		const warehouse = await seedWarehouse("0190f1a0-7b00-7000-8000-000000000003");

		const response = await agent.get(`${GET_WAREHOUSE}/${warehouse._id}`);

		expect(response.status).toBe(200);
		expect(response.body.warehouse).toMatchObject({
			id: warehouse._id,
			name: "Câmara Fria",
			description: "Armazenamento refrigerado",
		});
	});

	it("retorna 404 quando o ambiente consultado não existe", async () => {
		const { agent } = await sessionFor("operator");

		await agent.get(`${GET_WAREHOUSE}/0190f1a0-7b00-7000-8000-000000000004`).expect(404);
	});
});
