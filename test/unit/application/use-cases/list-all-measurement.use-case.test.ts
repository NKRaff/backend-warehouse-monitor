import { ListAllMeasurementUseCase } from "@application/use-cases/list-all-measurement.use-case.js";
import { Measurement } from "@domain/entities/measurement.js";
import { beforeEach, describe, expect, it } from "vitest";
import { createMeasurementRepoMock } from "../../../helpers/mocks.js";
import { resetSingleton } from "../../../helpers/singleton.js";

describe("ListAllMeasurementUseCase — RF-BE-022", () => {
	let repository: ReturnType<typeof createMeasurementRepoMock>;
	let useCase: ListAllMeasurementUseCase;

	beforeEach(() => {
		resetSingleton(ListAllMeasurementUseCase);
		repository = createMeasurementRepoMock();
		useCase = ListAllMeasurementUseCase.instance(repository);
	});

	it("encaminha filtros e paginação e devolve as medições encontradas", async () => {
		const startDate = new Date("2026-03-01T00:00:00.000Z");
		const endDate = new Date("2026-03-02T00:00:00.000Z");
		const measurement = Measurement.create({
			id: "measurement-1",
			deviceId: "AA:BB:CC:DD:EE:71",
			warehouseId: "0190f1a0-7b00-7000-8000-000000000071",
			type: "temperature",
			value: 4.5,
			createdAt: startDate,
		});
		repository.findAll.mockResolvedValue([measurement]);

		const result = await useCase.execute({
			filter: {
				deviceId: measurement.deviceId,
				warehouseId: measurement.warehouseId,
				type: "temperature",
				startDate,
				endDate,
			},
			pagination: { offSet: 5, limit: 10 },
		});

		expect(repository.findAll).toHaveBeenCalledExactlyOnceWith(
			{
				deviceId: measurement.deviceId,
				warehouseId: measurement.warehouseId,
				type: "temperature",
				startDate,
				endDate,
			},
			{ offSet: 5, limit: 10 },
		);
		expect(result.message).toEqual(expect.any(String));
		expect(result.measurements).toEqual([
			{
				id: measurement.id,
				deviceId: measurement.deviceId,
				warehouseId: measurement.warehouseId,
				type: measurement.type,
				value: measurement.value,
				createdAt: measurement.createdAt,
			},
		]);
	});

	it("encaminha filtro vazio e null quando a paginação não foi informada", async () => {
		await useCase.execute({ filter: {} });

		expect(repository.findAll).toHaveBeenCalledExactlyOnceWith({}, null);
	});

	it("devolve lista vazia sem inventar resultados", async () => {
		await expect(useCase.execute({ filter: {} })).resolves.toMatchObject({
			measurements: [],
		});
	});

	it("propaga falhas do repositório", async () => {
		repository.findAll.mockRejectedValue(new Error("Mongo indisponível"));

		await expect(useCase.execute({ filter: {} })).rejects.toThrow(
			"Mongo indisponível",
		);
	});

	it("mantém a dependência injetada na instância singleton", async () => {
		const otherRepository = createMeasurementRepoMock();
		const otherUseCase = ListAllMeasurementUseCase.instance(otherRepository);

		expect(otherUseCase).toBe(useCase);
		await otherUseCase.execute({ filter: {} });
		expect(repository.findAll).toHaveBeenCalledOnce();
		expect(otherRepository.findAll).not.toHaveBeenCalled();
	});

	it("não altera a entrada recebida", async () => {
		const input = { filter: { type: "humidity" as const } };
		const original = structuredClone(input);

		await useCase.execute(input);

		expect(input).toEqual(original);
		expect(repository.findAll).toHaveBeenCalledWith({ type: "humidity" }, null);
	});
});
