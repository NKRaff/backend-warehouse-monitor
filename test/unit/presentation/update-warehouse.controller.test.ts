import type {
	UpdateWarehouseInputDto,
	UpdateWarehouseOutputDto,
} from "@application/dtos/update-warehouse.js";
import type { IUseCase } from "@application/use-cases/use-case.interface.js";
import { MeasurementLimits } from "@domain/object-values/measurement-limits.js";
import { UpdateWarehouseController } from "@presentation/controllers/update-warehouse.controller.js";
import { UnauthorizedError } from "@shared/errors/unauthorized-error.js";
import { UnprocessableEntityError } from "@shared/errors/unprocessable-entity-error.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";
import { resetSingleton } from "../../helpers/singleton.js";

describe("UpdateWarehouseController — RF-BE-012", () => {
	let execute: ReturnType<
		typeof vi.fn<
			IUseCase<UpdateWarehouseInputDto, UpdateWarehouseOutputDto>["execute"]
		>
	>;
	let controller: UpdateWarehouseController;

	beforeEach(() => {
		resetSingleton(UpdateWarehouseController);
		execute = vi
			.fn<
				IUseCase<
					UpdateWarehouseInputDto,
					UpdateWarehouseOutputDto
				>["execute"]
			>()
			.mockResolvedValue({
				message: "Armazém atualizado com sucesso",
				warehouse: {
					id: "warehouse-1",
					name: "Câmara Fria",
					condition: "cold",
					category: "food",
					status: "inactive",
					description: "Armazenamento refrigerado",
				},
			});
		controller = UpdateWarehouseController.instance({ execute });
	});

	it("valida os campos e transforma limites em MeasurementLimits", async () => {
		const limits = {
			temperature: { min: 2, max: 8 },
			humidity: { min: 30, max: 60 },
		};

		await controller.handle(
			{ id: "warehouse-1", name: "Câmara Fria", limits },
			{ actorId: "manager-1" },
		);

		expect(execute).toHaveBeenCalledExactlyOnceWith({
			actorId: "manager-1",
			warehouse: {
				id: "warehouse-1",
				name: "Câmara Fria",
				limits: new MeasurementLimits(limits.temperature, limits.humidity),
			},
		});
	});

	it("rejeita contexto sem ator sem chamar o caso de uso", async () => {
		await expect(
			controller.handle({ id: "warehouse-1", name: "Câmara Fria" }, {}),
		).rejects.toThrow(UnauthorizedError);
		expect(execute).not.toHaveBeenCalled();
	});

	it("rejeita categoria invalida sem chamar o caso de uso", async () => {
		await expect(
			controller.handle(
				{ id: "warehouse-1", category: "misc" },
				{ actorId: "manager-1" },
			),
		).rejects.toBeInstanceOf(ZodError);
		expect(execute).not.toHaveBeenCalled();
	});

	it("rejeita limites inconsistentes antes de executar o caso de uso", async () => {
		await expect(
			controller.handle(
				{
					id: "warehouse-1",
					limits: {
						temperature: { min: 8, max: 2 },
						humidity: { min: 30, max: 60 },
					},
				},
				{ actorId: "manager-1" },
			),
		).rejects.toThrow(UnprocessableEntityError);
		expect(execute).not.toHaveBeenCalled();
	});
});
