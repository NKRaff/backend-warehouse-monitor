import type { UpdateWarehouseInputDto } from "@application/dtos/update-warehouse.js";
import { UpdateWarehouseUseCase } from "@application/use-cases/update-warehouse.use-case.js";
import { Warehouse } from "@domain/entities/warehouse.js";
import { MeasurementLimits } from "@domain/object-values/measurement-limits.js";
import { NotFoundError } from "@shared/errors/not-found-error.js";
import { UnprocessableEntityError } from "@shared/errors/unprocessable-entity-error.js";
import { beforeEach, describe, expect, it } from "vitest";
import {
	createAuditLogRepoMock,
	createUuidProviderMock,
	createWarehouseRepoMock,
} from "../../../helpers/mocks.js";
import { resetSingleton } from "../../../helpers/singleton.js";

const existingWarehouse = () =>
	Warehouse.restore({
		id: "warehouse-1",
		name: "Câmara Fria",
		condition: "cold",
		category: "food",
		status: "inactive",
		description: "Armazenamento refrigerado",
		limits: new MeasurementLimits(
			{ min: 2, max: 8 },
			{ min: 30, max: 60 },
		),
	});

describe("UpdateWarehouseUseCase — RF-BE-012", () => {
	beforeEach(() => resetSingleton(UpdateWarehouseUseCase));

	it("atualiza os campos informados e audita valores antigos e novos", async () => {
		const warehouses = createWarehouseRepoMock();
		warehouses.findById.mockResolvedValue(existingWarehouse());
		const audit = createAuditLogRepoMock();
		const useCase = UpdateWarehouseUseCase.instance(
			createUuidProviderMock(),
			warehouses,
			audit,
		);
		const limits = new MeasurementLimits(
			{ min: 1, max: 9 },
			{ min: 25, max: 65 },
		);
		const input: UpdateWarehouseInputDto = {
			actorId: "manager-1",
			warehouse: {
				id: "warehouse-1",
				name: "  Câmara Nova  ",
				status: "active",
				limits,
			},
		};

		const result = await useCase.execute(input);

		expect(warehouses.findById).toHaveBeenCalledExactlyOnceWith("warehouse-1");
		expect(warehouses.updateById).toHaveBeenCalledExactlyOnceWith(
			"warehouse-1",
			"Câmara Nova",
			undefined,
			undefined,
			"active",
			undefined,
			limits,
		);
		expect(audit.save).toHaveBeenCalledWith(
			expect.objectContaining({
				id: "uuid-1",
				action: "update",
				actorId: "manager-1",
				resourceId: "warehouse-1",
				resourceType: "warehouse",
				metadata: {
					old: expect.objectContaining({
						name: "Câmara Fria",
						status: "inactive",
						limits: {
							temperature: { min: 2, max: 8 },
							humidity: { min: 30, max: 60 },
						},
					}),
					new: expect.objectContaining({
						name: "Câmara Nova",
						status: "active",
						limits: {
							temperature: { min: 1, max: 9 },
							humidity: { min: 25, max: 65 },
						},
					}),
				},
			}),
		);
		expect(result).toMatchObject({
			message: "Armazém atualizado com sucesso",
			warehouse: {
				id: "warehouse-1",
				name: "Câmara Nova",
				condition: "cold",
				category: "food",
				status: "active",
				description: "Armazenamento refrigerado",
				limits: {
					temperature: { min: 1, max: 9 },
					humidity: { min: 25, max: 65 },
				},
			},
		});
	});

	it("preserva os limites existentes quando a atualização os omite", async () => {
		const warehouses = createWarehouseRepoMock();
		warehouses.findById.mockResolvedValue(existingWarehouse());
		const useCase = UpdateWarehouseUseCase.instance(
			createUuidProviderMock(),
			warehouses,
			createAuditLogRepoMock(),
		);

		const result = await useCase.execute({
			actorId: "manager-1",
			warehouse: { id: "warehouse-1", description: "Novo texto" },
		});

		expect(result.warehouse.limits).toEqual({
			temperature: { min: 2, max: 8 },
			humidity: { min: 30, max: 60 },
		});
		expect(warehouses.updateById).toHaveBeenCalledWith(
			"warehouse-1",
			undefined,
			undefined,
			undefined,
			undefined,
			"Novo texto",
			undefined,
		);
	});

	it("rejeita uma atualizacao sem campos e nao consulta o repositorio", async () => {
		const warehouses = createWarehouseRepoMock();
		const audit = createAuditLogRepoMock();
		const useCase = UpdateWarehouseUseCase.instance(
			createUuidProviderMock(),
			warehouses,
			audit,
		);

		await expect(
			useCase.execute({
				actorId: "manager-1",
				warehouse: { id: "warehouse-1" },
			}),
		).rejects.toThrow(UnprocessableEntityError);
		expect(warehouses.findById).not.toHaveBeenCalled();
		expect(warehouses.updateById).not.toHaveBeenCalled();
		expect(audit.save).not.toHaveBeenCalled();
	});

	it("rejeita nome que fica menor que quatro caracteres depois de remover espacos", async () => {
		const warehouses = createWarehouseRepoMock();
		const audit = createAuditLogRepoMock();
		const useCase = UpdateWarehouseUseCase.instance(
			createUuidProviderMock(),
			warehouses,
			audit,
		);

		await expect(
			useCase.execute({
				actorId: "manager-1",
				warehouse: { id: "warehouse-1", name: "  A  " },
			}),
		).rejects.toThrow(UnprocessableEntityError);
		expect(warehouses.findById).not.toHaveBeenCalled();
		expect(audit.save).not.toHaveBeenCalled();
	});

	it("retorna nao encontrado sem atualizar ou auditar quando o id nao existe", async () => {
		const warehouses = createWarehouseRepoMock();
		const audit = createAuditLogRepoMock();
		const useCase = UpdateWarehouseUseCase.instance(
			createUuidProviderMock(),
			warehouses,
			audit,
		);

		await expect(
			useCase.execute({
				actorId: "manager-1",
				warehouse: { id: "missing", name: "Armazem novo" },
			}),
		).rejects.toThrow(NotFoundError);
		expect(warehouses.updateById).not.toHaveBeenCalled();
		expect(audit.save).not.toHaveBeenCalled();
	});

	it("nao registra auditoria se a atualizacao no repositorio falhar", async () => {
		const warehouses = createWarehouseRepoMock();
		warehouses.findById.mockResolvedValue(existingWarehouse());
		warehouses.updateById.mockRejectedValue(new Error("falha ao atualizar"));
		const audit = createAuditLogRepoMock();
		const useCase = UpdateWarehouseUseCase.instance(
			createUuidProviderMock(),
			warehouses,
			audit,
		);

		await expect(
			useCase.execute({
				actorId: "manager-1",
				warehouse: { id: "warehouse-1", name: "Câmara Nova" },
			}),
		).rejects.toThrow("falha ao atualizar");
		expect(audit.save).not.toHaveBeenCalled();
	});

	it("propaga falha de auditoria depois de solicitar a atualizacao", async () => {
		const warehouses = createWarehouseRepoMock();
		warehouses.findById.mockResolvedValue(existingWarehouse());
		const audit = createAuditLogRepoMock();
		audit.save.mockRejectedValue(new Error("falha na auditoria"));
		const useCase = UpdateWarehouseUseCase.instance(
			createUuidProviderMock(),
			warehouses,
			audit,
		);

		await expect(
			useCase.execute({
				actorId: "manager-1",
				warehouse: { id: "warehouse-1", name: "Câmara Nova" },
			}),
		).rejects.toThrow("falha na auditoria");
		expect(warehouses.updateById).toHaveBeenCalledOnce();
	});

	it("reutiliza a instancia configurada primeiro", async () => {
		const warehouses = createWarehouseRepoMock();
		warehouses.findById.mockResolvedValue(existingWarehouse());
		const audit = createAuditLogRepoMock();
		const first = UpdateWarehouseUseCase.instance(
			createUuidProviderMock(),
			warehouses,
			audit,
		);
		const ignoredWarehouses = createWarehouseRepoMock();
		const second = UpdateWarehouseUseCase.instance(
			createUuidProviderMock(),
			ignoredWarehouses,
			createAuditLogRepoMock(),
		);

		expect(second).toBe(first);
		await second.execute({
			actorId: "manager-1",
			warehouse: { id: "warehouse-1", name: "Câmara Nova" },
		});
		expect(warehouses.updateById).toHaveBeenCalledOnce();
		expect(ignoredWarehouses.findById).not.toHaveBeenCalled();
	});
});
