import type { GetWarehouseInputDto, GetWarehouseOutputDto } from "@application/dtos/get-warehouse.dto.js";
import type { ListAllWarehouseInputDto, ListAllWarehouseOutputDto } from "@application/dtos/list-all-warehouse.dto.js";
import type { IUseCase } from "@application/use-cases/use-case.interface.js";
import { GetWarehouseController } from "@presentation/controllers/get-warehouse.controller.js";
import { ListAllWarehouseController } from "@presentation/controllers/list-all-warehouse.controller.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";
import { resetSingleton } from "../../helpers/singleton.js";

describe("Controllers de consulta de armazéns — RF-BE-014", () => {
	beforeEach(() => resetSingleton(GetWarehouseController, ListAllWarehouseController));

	it("converte parâmetros de paginação da query em números", async () => {
		const execute = vi.fn<IUseCase<ListAllWarehouseInputDto, ListAllWarehouseOutputDto>["execute"]>().mockResolvedValue({ message: "Lista", warehouses: [] });
		const controller = ListAllWarehouseController.instance({ execute });

		await controller.handle({ offSet: "5", limit: "10" }, {});

		expect(execute).toHaveBeenCalledExactlyOnceWith({ offSet: 5, limit: 10 });
	});

	it("rejeita paginação ausente ou não numérica sem consultar", async () => {
		const execute = vi.fn<IUseCase<ListAllWarehouseInputDto, ListAllWarehouseOutputDto>["execute"]>();
		const controller = ListAllWarehouseController.instance({ execute });

		await expect(controller.handle({ offSet: "x", limit: "10" }, {})).rejects.toBeInstanceOf(ZodError);
		expect(execute).not.toHaveBeenCalled();
	});

	it("rejeita UUID inválido antes de consultar o armazém", async () => {
		const execute = vi.fn<IUseCase<GetWarehouseInputDto, GetWarehouseOutputDto>["execute"]>();
		const controller = GetWarehouseController.instance({ execute });

		await expect(controller.handle({ warehouseId: "not-a-uuid" }, {})).rejects.toBeInstanceOf(ZodError);
		expect(execute).not.toHaveBeenCalled();
	});
});
