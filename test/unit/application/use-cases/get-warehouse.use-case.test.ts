import { GetWarehouseUseCase } from "@application/use-cases/get-warehouse.use-case.js";
import { Warehouse } from "@domain/entities/warehouse.js";
import { MeasurementLimits } from "@domain/object-values/measurement-limits.js";
import { NotFoundError } from "@shared/errors/not-found-error.js";
import { beforeEach, describe, expect, it } from "vitest";
import { createWarehouseRepoMock } from "../../../helpers/mocks.js";
import { resetSingleton } from "../../../helpers/singleton.js";

describe("GetWarehouseUseCase — RF-BE-014", () => {
	beforeEach(() => resetSingleton(GetWarehouseUseCase));

	it("retorna os dados do ambiente encontrado", async () => {
		const repository = createWarehouseRepoMock();
		const id = "0190f1a0-7b00-7000-8000-000000000001";
		repository.findById.mockResolvedValue(
			Warehouse.restore({
				id,
				name: "Câmara Fria",
				category: "food",
				condition: "cold",
				status: "active",
				description: "Estoque refrigerado",
			}),
		);
		const useCase = GetWarehouseUseCase.instance(repository);

		const result = await useCase.execute({ warehouseId: id });

		expect(repository.findById).toHaveBeenCalledExactlyOnceWith(id);
		expect(GetWarehouseUseCase.instance(repository)).toBe(useCase);
		expect(result.warehouse).toMatchObject({
			id,
			name: "Câmara Fria",
			category: "food",
			condition: "cold",
			description: "Estoque refrigerado",
			status: "active",
		});
	});

	it("inclui limites e data de remoção quando existentes", async () => {
		const repository = createWarehouseRepoMock();
		const id = "0190f1a0-7b00-7000-8000-000000000001";
		const deletedAt = new Date("2026-01-01T00:00:00.000Z");
		const limits = new MeasurementLimits(
			{ min: 2, max: 8 },
			{ min: 30, max: 60 },
		);
		repository.findById.mockResolvedValue(
			Warehouse.restore({
				id,
				name: "Câmara Fria",
				category: "food",
				condition: "cold",
				status: "inactive",
				description: "Estoque refrigerado",
				limits,
				deletedAt,
			}),
		);
		const useCase = GetWarehouseUseCase.instance(repository);

		const result = await useCase.execute({ warehouseId: id });

		expect(result.warehouse).toMatchObject({
			limits: { temperature: { min: 2, max: 8 }, humidity: { min: 30, max: 60 } },
			deletedAt,
		});
	});

	it("retorna não encontrado para ambiente ausente", async () => {
		const useCase = GetWarehouseUseCase.instance(createWarehouseRepoMock());

		await expect(
			useCase.execute({ warehouseId: "0190f1a0-7b00-7000-8000-000000000001" }),
		).rejects.toBeInstanceOf(NotFoundError);
	});
});
