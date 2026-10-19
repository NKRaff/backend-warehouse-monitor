import { CreateWarehouseUseCase } from "@application/use-cases/create-warehouse.use-case.js";
import { Warehouse } from "@domain/entities/warehouse.js";
import { MeasurementLimits } from "@domain/object-values/measurement-limits.js";
import { ConflictError } from "@shared/errors/conflict-error.js";
import { UnprocessableEntityError } from "@shared/errors/unprocessable-entity-error.js";
import { beforeEach, describe, expect, it } from "vitest";
import {
	createAuditLogRepoMock,
	createUuidProviderMock,
	createWarehouseRepoMock,
} from "../../../helpers/mocks.js";
import { resetSingleton } from "../../../helpers/singleton.js";

describe("CreateWarehouseUseCase — RF-BE-011", () => {
	beforeEach(() => resetSingleton(CreateWarehouseUseCase));

	it("cria armazém normalizado, persiste e audita o ator", async () => {
		const warehouses = createWarehouseRepoMock();
		const audit = createAuditLogRepoMock();
		const useCase = CreateWarehouseUseCase.instance(
			createUuidProviderMock(),
			warehouses,
			audit,
		);

		const result = await useCase.execute({
			actorId: "manager-1",
			name: "  Câmara Fria  ",
			condition: "cold",
			category: "food",
		});

		expect(warehouses.findByName).toHaveBeenCalledWith("Câmara Fria");
		expect(warehouses.save).toHaveBeenCalledWith(
			expect.objectContaining({
				id: "uuid-1",
				name: "Câmara Fria",
				condition: "cold",
				category: "food",
				description: "No description",
				status: "inactive",
			}),
		);
		expect(audit.save).toHaveBeenCalledWith(
			expect.objectContaining({
				id: "uuid-2",
				action: "create",
				actorId: "manager-1",
				resourceId: "uuid-1",
				resourceType: "warehouse",
			}),
		);
		expect(result).toMatchObject({
			message: "Armazém criado com sucesso",
			warehouse: {
				id: "uuid-1",
				name: "Câmara Fria",
				description: "No description",
			},
		});
	});

	it("rejeita nome duplicado sem persistir nem auditar", async () => {
		const warehouses = createWarehouseRepoMock();
		warehouses.findByName.mockResolvedValue(
			Warehouse.create({
				id: "existing-warehouse",
				name: "Câmara Fria",
				condition: "cold",
				category: "food",
			}),
		);
		const audit = createAuditLogRepoMock();
		const useCase = CreateWarehouseUseCase.instance(
			createUuidProviderMock(),
			warehouses,
			audit,
		);

		await expect(
			useCase.execute({
				actorId: "manager-1",
				name: "Câmara Fria",
				condition: "cold",
				category: "food",
			}),
		).rejects.toThrow(ConflictError);
		expect(warehouses.save).not.toHaveBeenCalled();
		expect(audit.save).not.toHaveBeenCalled();
	});

	it("rejeita limites inválidos sem persistir", async () => {
		const warehouses = createWarehouseRepoMock();
		const audit = createAuditLogRepoMock();
		const useCase = CreateWarehouseUseCase.instance(
			createUuidProviderMock(),
			warehouses,
			audit,
		);

		await expect(
			useCase.execute({
				actorId: "manager-1",
				name: "Câmara Fria",
				condition: "cold",
				category: "food",
				limits: {
					temperature: { min: 8, max: 2 },
					humidity: { min: 30, max: 60 },
				},
			}),
		).rejects.toThrow(UnprocessableEntityError);
		expect(warehouses.save).not.toHaveBeenCalled();
		expect(audit.save).not.toHaveBeenCalled();
	});

	it("converte limites válidos em value object e devolve valores serializáveis", async () => {
		const warehouses = createWarehouseRepoMock();
		const useCase = CreateWarehouseUseCase.instance(
			createUuidProviderMock(),
			warehouses,
			createAuditLogRepoMock(),
		);
		const limits = {
			temperature: { min: 2, max: 8 },
			humidity: { min: 30, max: 60 },
		};

		const result = await useCase.execute({
			actorId: "manager-1",
			name: "Câmara Fria",
			condition: "cold",
			category: "food",
			limits,
		});

		expect(warehouses.save).toHaveBeenCalledWith(
			expect.objectContaining({ limits: expect.any(MeasurementLimits) }),
		);
		expect(result.warehouse.limits).toEqual(limits);
	});
});
