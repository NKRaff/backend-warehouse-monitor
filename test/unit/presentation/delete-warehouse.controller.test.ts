import type {
	DeleteWarehouseInputDto,
	DeleteWarehouseOutputDto,
} from "@application/dtos/delete-warehouse.dto.js";
import type { IUseCase } from "@application/use-cases/use-case.interface.js";
import { DeleteWarehouseController } from "@presentation/controllers/delete-warehouse.controller.js";
import { UnauthorizedError } from "@shared/errors/unauthorized-error.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";
import { resetSingleton } from "../../helpers/singleton.js";

describe("DeleteWarehouseController — RF-BE-013", () => {
	let execute: ReturnType<
		typeof vi.fn<
			IUseCase<DeleteWarehouseInputDto, DeleteWarehouseOutputDto>["execute"]
		>
	>;
	let controller: DeleteWarehouseController;

	beforeEach(() => {
		resetSingleton(DeleteWarehouseController);
		execute = vi
			.fn<
				IUseCase<
					DeleteWarehouseInputDto,
					DeleteWarehouseOutputDto
				>["execute"]
			>()
			.mockResolvedValue({ message: "Armazém excluido com sucesso" });
		controller = DeleteWarehouseController.instance({ execute });
	});

	it("valida o identificador e inclui o ator do contexto", async () => {
		await controller.handle(
			{ warehouseId: "warehouse-1" },
			{ actorId: "manager-1" },
		);

		expect(execute).toHaveBeenCalledExactlyOnceWith({
			warehouseId: "warehouse-1",
			actorId: "manager-1",
		});
	});

	it("rejeita contexto sem ator sem chamar o caso de uso", async () => {
		await expect(
			controller.handle({ warehouseId: "warehouse-1" }, {}),
		).rejects.toThrow(UnauthorizedError);
		expect(execute).not.toHaveBeenCalled();
	});

	it("rejeita identificador que não seja string sem chamar o caso de uso", async () => {
		await expect(
			controller.handle(
				{ warehouseId: 123 },
				{ actorId: "manager-1" },
			),
		).rejects.toBeInstanceOf(ZodError);
		expect(execute).not.toHaveBeenCalled();
	});
});
