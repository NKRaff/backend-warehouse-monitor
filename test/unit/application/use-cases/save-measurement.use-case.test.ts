import { SaveMeasurementUseCase } from "@application/use-cases/save-measurement.use-case.js";
import { Device } from "@domain/entities/device.js";
import { Warehouse } from "@domain/entities/warehouse.js";
import { NotFoundError } from "@shared/errors/not-found-error.js";
import { UnprocessableEntityError } from "@shared/errors/unprocessable-entity-error.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	createDeviceRepoMock,
	createMeasurementRepoMock,
	createWarehouseRepoMock,
} from "../../../helpers/mocks.js";
import { resetSingleton } from "../../../helpers/singleton.js";

const warehouseId = "0190f1a0-7b00-7000-8000-000000000071";
const ids = [
	"0190f1a0-7b00-7000-8000-000000000001",
	"0190f1a0-7b00-7000-8000-000000000002",
];

describe("SaveMeasurementUseCase — RF-BE-021", () => {
	it.todo("não persiste valores iguais à última medição do dispositivo");
	it.todo("descarta valores fisicamente implausíveis, como umidade acima de 100%");
	it.todo("descarta dispositivo removido ou desconhecido e registra a ocorrência");

	let devices: ReturnType<typeof createDeviceRepoMock>;
	let warehouses: ReturnType<typeof createWarehouseRepoMock>;
	let measurements: ReturnType<typeof createMeasurementRepoMock>;
	let useCase: SaveMeasurementUseCase;

	beforeEach(() => {
		resetSingleton(SaveMeasurementUseCase);
		devices = createDeviceRepoMock();
		warehouses = createWarehouseRepoMock();
		measurements = createMeasurementRepoMock();
		let index = 0;
		useCase = SaveMeasurementUseCase.instance(
			{ generate: vi.fn(() => ids[index++]!) },
			devices,
			warehouses,
			measurements,
		);
	});

	const input = {
		deviceId: "AA:BB:CC:DD:EE:71",
		values: { temperature: 4.5, humidity: 55 },
		createdAt: new Date("2026-03-01T08:00:00.000Z"),
	};
	const linkedDevice = () =>
		Device.restore({
			mac: input.deviceId,
			name: "Sensor da câmara",
			warehouseId,
			deviceStatus: "online",
			monitoringStatus: "enabled",
		});
	const warehouse = (status: "active" | "inactive" = "active") =>
		Warehouse.restore({
			id: warehouseId,
			name: "Câmara Fria",
			condition: "cold",
			category: "food",
			status,
			description: "Câmara de armazenamento",
		});

	it("salva as duas leituras e atualiza os ids mais recentes do dispositivo", async () => {
		const device = linkedDevice();
		devices.findById.mockResolvedValue(device);
		warehouses.findById.mockResolvedValue(warehouse());

		await useCase.execute(input);

		expect(devices.findById).toHaveBeenCalledExactlyOnceWith(input.deviceId);
		expect(warehouses.findById).toHaveBeenCalledExactlyOnceWith(warehouseId);
		expect(devices.updateById).toHaveBeenCalledExactlyOnceWith({
			mac: input.deviceId,
			lastMeasurementId: {
				humidityId: ids[0],
				temperatureId: ids[1],
			},
		});
		expect(measurements.saveMany).toHaveBeenCalledOnce();
		const saved = measurements.saveMany.mock.calls[0]![0];
		expect(saved).toHaveLength(2);
		expect(saved).toEqual([
			expect.objectContaining({
				id: ids[1],
				type: "temperature",
				value: input.values.temperature,
				deviceId: input.deviceId,
				warehouseId,
				createdAt: input.createdAt,
			}),
			expect.objectContaining({
				id: ids[0],
				type: "humidity",
				value: input.values.humidity,
				deviceId: input.deviceId,
				warehouseId,
				createdAt: input.createdAt,
			}),
		]);
	});

	it("retorna NotFoundError quando o dispositivo não existe", async () => {
		await expect(useCase.execute(input)).rejects.toBeInstanceOf(NotFoundError);
		expect(warehouses.findById).not.toHaveBeenCalled();
		expect(devices.updateById).not.toHaveBeenCalled();
		expect(measurements.saveMany).not.toHaveBeenCalled();
	});

	it("rejeita dispositivo sem armazém vinculado", async () => {
		devices.findById.mockResolvedValue(
			Device.restore({
				mac: input.deviceId,
				name: "Sensor independente",
				deviceStatus: "online",
				monitoringStatus: "enabled",
			}),
		);

		await expect(useCase.execute(input)).rejects.toBeInstanceOf(
			UnprocessableEntityError,
		);
		expect(warehouses.findById).not.toHaveBeenCalled();
		expect(measurements.saveMany).not.toHaveBeenCalled();
	});

	it("retorna NotFoundError quando o armazém vinculado não existe", async () => {
		devices.findById.mockResolvedValue(linkedDevice());

		await expect(useCase.execute(input)).rejects.toBeInstanceOf(NotFoundError);
		expect(devices.updateById).not.toHaveBeenCalled();
		expect(measurements.saveMany).not.toHaveBeenCalled();
	});

	it("rejeita medições quando o armazém está inativo", async () => {
		devices.findById.mockResolvedValue(linkedDevice());
		warehouses.findById.mockResolvedValue(warehouse("inactive"));

		await expect(useCase.execute(input)).rejects.toBeInstanceOf(
			UnprocessableEntityError,
		);
		expect(devices.updateById).not.toHaveBeenCalled();
		expect(measurements.saveMany).not.toHaveBeenCalled();
	});

	it("não salva as medições se falhar a atualização do dispositivo", async () => {
		devices.findById.mockResolvedValue(linkedDevice());
		warehouses.findById.mockResolvedValue(warehouse());
		devices.updateById.mockRejectedValue(new Error("Mongo indisponível"));

		await expect(useCase.execute(input)).rejects.toThrow("Mongo indisponível");
		expect(measurements.saveMany).not.toHaveBeenCalled();
	});
});
