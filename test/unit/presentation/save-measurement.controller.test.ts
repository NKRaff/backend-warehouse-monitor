import type { SaveMeasurementInputDto } from "@application/dtos/save-measurement.dto.js";
import type { IUseCase } from "@application/use-cases/use-case.interface.js";
import { SaveMeasurementController } from "@presentation/controllers/save-measurement.controller.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";
import { resetSingleton } from "../../helpers/singleton.js";

describe("SaveMeasurementController — RF-BE-021", () => {
	let execute: ReturnType<typeof vi.fn>;
	let controller: SaveMeasurementController;

	beforeEach(() => {
		resetSingleton(SaveMeasurementController);
		execute = vi.fn().mockResolvedValue({ message: "Medições salvas" });
		const useCase = { execute } as unknown as IUseCase<
			SaveMeasurementInputDto,
			{ message: string }
		>;
		controller = SaveMeasurementController.instance(useCase);
	});

	it("combina o MAC do tópico com os campos válidos do payload", async () => {
		const createdAt = "2026-03-01T08:00:00.000Z";
		const payload = Buffer.from(
			JSON.stringify({
				createdAt: new Date(createdAt),
				values: { temperature: 4.5, humidity: 55 },
			}),
		);

		await controller.handle(
			{ mac: "AA:BB:CC:DD:EE:71", payload },
			{},
		);

		expect(execute).toHaveBeenCalledExactlyOnceWith({
			deviceId: "AA:BB:CC:DD:EE:71",
			createdAt: new Date(createdAt),
			values: { temperature: 4.5, humidity: 55 },
		});
	});

	it("rejeita JSON malformado sem chamar o caso de uso", async () => {
		await expect(
			controller.handle(
				{ mac: "AA:BB:CC:DD:EE:71", payload: Buffer.from("{") },
				{},
			),
		).rejects.toThrow(SyntaxError);
		expect(execute).not.toHaveBeenCalled();
	});

	it("rejeita dados incompletos ou com valores não numéricos", async () => {
		const invalidPayloads = [
			{ createdAt: "2026-03-01T08:00:00.000Z", values: { temperature: 4.5 } },
			{ createdAt: "data inválida", values: { temperature: 4.5, humidity: 55 } },
			{
				createdAt: "2026-03-01T08:00:00.000Z",
				values: { temperature: "4.5", humidity: 55 },
			},
		];

		for (const data of invalidPayloads) {
			await expect(
				controller.handle(
					{ mac: "AA:BB:CC:DD:EE:71", payload: Buffer.from(JSON.stringify(data)) },
					{},
				),
			).rejects.toBeInstanceOf(ZodError);
		}
		expect(execute).not.toHaveBeenCalled();
	});
});
