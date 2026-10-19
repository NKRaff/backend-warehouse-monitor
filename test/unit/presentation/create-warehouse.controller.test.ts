import type {
	CreateWarehouseInputDto,
	CreateWarehouseOutputDto,
} from "@application/dtos/create-warehouse.dto.js";
import type { IUseCase } from "@application/use-cases/use-case.interface.js";
import { CreateWarehouseController } from "@presentation/controllers/create-warehouse.controller.js";
import { UnauthorizedError } from "@shared/errors/unauthorized-error.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";
import { resetSingleton } from "../../helpers/singleton.js";

describe("CreateWarehouseController — RF-BE-011", () => {
	let execute: ReturnType<typeof vi.fn<IUseCase<CreateWarehouseInputDto, CreateWarehouseOutputDto>["execute"]>>;
	let controller: CreateWarehouseController;

	beforeEach(() => {
		resetSingleton(CreateWarehouseController);
		execute = vi.fn<IUseCase<CreateWarehouseInputDto, CreateWarehouseOutputDto>["execute"]>().mockResolvedValue({
			message: "Armazém criado com sucesso",
			warehouse: {
				id: "warehouse-1",
				name: "Câmara Fria",
				condition: "cold",
				category: "food",
				description: "No description",
			},
		});
		controller = CreateWarehouseController.instance({ execute });
	});

	it("valida os dados e inclui o ator do contexto", async () => {
		const input = {
			name: "Câmara Fria",
			category: "food",
			condition: "cold",
		};

		await controller.handle(input, { actorId: "manager-1" });

		expect(execute).toHaveBeenCalledExactlyOnceWith({
			...input,
			actorId: "manager-1",
		});
	});

	it("rejeita contexto sem ator sem chamar o caso de uso", async () => {
		await expect(
			controller.handle(
				{ name: "Câmara Fria", category: "food", condition: "cold" },
				{},
			),
		).rejects.toThrow(UnauthorizedError);
		expect(execute).not.toHaveBeenCalled();
	});

	it("rejeita categoria inválida sem chamar o caso de uso", async () => {
		await expect(
			controller.handle(
				{ name: "Câmara Fria", category: "misc", condition: "cold" },
				{ actorId: "manager-1" },
			),
		).rejects.toBeInstanceOf(ZodError);
		expect(execute).not.toHaveBeenCalled();
	});
});
