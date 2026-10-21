import { ListAllWarehouseUseCase } from "@application/use-cases/list-all-warehouse.use-case.js";
import { Warehouse } from "@domain/entities/warehouse.js";
import { beforeEach, describe, expect, it } from "vitest";
import { createWarehouseRepoMock } from "../../../helpers/mocks.js";
import { resetSingleton } from "../../../helpers/singleton.js";

describe("ListAllWarehouseUseCase — RF-BE-014", () => {
	beforeEach(() => resetSingleton(ListAllWarehouseUseCase));

	it("retorna os ambientes ativos recebidos do repositório com paginação e descrição", async () => {
		const repository = createWarehouseRepoMock();
		repository.findAll.mockResolvedValue([
			Warehouse.restore({
				id: "0190f1a0-7b00-7000-8000-000000000001",
				name: "Câmara Fria",
				category: "food",
				condition: "cold",
				status: "inactive",
				description: "Estoque refrigerado",
			}),
		]);
		const useCase = ListAllWarehouseUseCase.instance(repository);

		const result = await useCase.execute({ offSet: 10, limit: 5 });

		expect(repository.findAll).toHaveBeenCalledExactlyOnceWith(10, 5);
		expect(ListAllWarehouseUseCase.instance(repository)).toBe(useCase);
		expect(result.warehouses).toEqual([
			{
				id: "0190f1a0-7b00-7000-8000-000000000001",
				name: "Câmara Fria",
				description: "Estoque refrigerado",
				category: "food",
				condition: "cold",
				status: "inactive",
			},
		]);
	});

	it("retorna lista vazia quando não há ambientes na página", async () => {
		const repository = createWarehouseRepoMock();
		const useCase = ListAllWarehouseUseCase.instance(repository);

		const result = await useCase.execute({ offSet: 0, limit: 10 });

		expect(result.warehouses).toEqual([]);
	});
});
