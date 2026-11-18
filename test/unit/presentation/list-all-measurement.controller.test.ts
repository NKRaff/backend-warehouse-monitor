import type {
	ListAllMeasurementInputDto,
	ListAllMeasurementOutputDto,
} from "@application/dtos/list-all-measurement.dto.js";
import type { IUseCase } from "@application/use-cases/use-case.interface.js";
import { ListAllMeasurementController } from "@presentation/controllers/list-all-measurement.controller.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";
import { resetSingleton } from "../../helpers/singleton.js";

describe("ListAllMeasurementController — RF-BE-022", () => {
	let execute: ReturnType<
		typeof vi.fn<
			IUseCase<
				ListAllMeasurementInputDto,
				ListAllMeasurementOutputDto
			>["execute"]
		>
	>;
	let controller: ListAllMeasurementController;

	beforeEach(() => {
		resetSingleton(ListAllMeasurementController);
		execute = vi.fn().mockResolvedValue({ message: "Lista", measurements: [] });
		controller = ListAllMeasurementController.instance({ execute });
	});

	it("converte datas ISO e paginação para os tipos do caso de uso", async () => {
		await controller.handle(
			{
				filter: {
					deviceId: "AA:BB:CC:DD:EE:71",
					warehouseId: "0190f1a0-7b00-7000-8000-000000000071",
					type: "temperature",
					startDate: "2026-03-01T00:00:00.000Z",
					endDate: "2026-03-02T00:00:00.000Z",
				},
				pagination: { offSet: "5", limit: "10" },
			},
			{},
		);

		expect(execute).toHaveBeenCalledExactlyOnceWith({
			filter: {
				deviceId: "AA:BB:CC:DD:EE:71",
				warehouseId: "0190f1a0-7b00-7000-8000-000000000071",
				type: "temperature",
				startDate: new Date("2026-03-01T00:00:00.000Z"),
				endDate: new Date("2026-03-02T00:00:00.000Z"),
			},
			pagination: { offSet: 5, limit: 10 },
		});
	});

	it.each([
		{ filter: { deviceId: "mac-inválido" } },
		{ filter: { warehouseId: "uuid-inválido" } },
		{ filter: { type: "pressure" } },
		{ filter: { startDate: "data-inválida" } },
		{ filter: { endDate: "data-inválida" } },
		{ filter: {}, pagination: { offSet: "x", limit: "10" } },
	])("rejeita filtro ou paginação inválidos: $filter", async (input) => {
		await expect(controller.handle(input, {})).rejects.toBeInstanceOf(ZodError);
		expect(execute).not.toHaveBeenCalled();
	});

	it("propaga a resposta do caso de uso", async () => {
		const expected = { message: "Lista", measurements: [] };
		execute.mockResolvedValue(expected);

		await expect(controller.handle({ filter: {} }, {})).resolves.toBe(expected);
	});
});
