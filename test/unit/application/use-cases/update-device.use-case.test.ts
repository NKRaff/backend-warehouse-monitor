import { UpdateDeviceUseCase } from "@application/use-cases/update-device.use-case.js";
import { Device } from "@domain/entities/device.js";
import { NotFoundError } from "@shared/errors/not-found-error.js";
import { beforeEach, describe, expect, it } from "vitest";
import { createDeviceRepoMock } from "../../../helpers/mocks.js";
import { resetSingleton } from "../../../helpers/singleton.js";

const existingDevice = () =>
	Device.restore({
		mac: "AA:BB:CC:DD:EE:20",
		name: "Sensor antigo",
		warehouseId: "0190f1a0-7b00-7000-8000-000000000020",
		lastMeasurementId: "0190f1a0-7b00-7000-8000-000000000021",
		deviceStatus: "online",
		monitoringStatus: "disabled",
	});

describe("UpdateDeviceUseCase — RF-BE-016", () => {
	beforeEach(() => resetSingleton(UpdateDeviceUseCase));

	it("atualiza parcialmente preservando campos omitidos e a entidade carregada", async () => {
		const devices = createDeviceRepoMock();
		const loadedDevice = existingDevice();
		devices.findById.mockResolvedValue(loadedDevice);
		const useCase = UpdateDeviceUseCase.instance(devices);

		const result = await useCase.execute({
			actorId: "manager-1",
			device: { mac: "AA:BB:CC:DD:EE:20", name: "Sensor atualizado" },
		});

		expect(devices.updateById).toHaveBeenCalledExactlyOnceWith({
			mac: "AA:BB:CC:DD:EE:20",
			name: "Sensor atualizado",
		});
		expect(result).toEqual({
			message: "Dispositivo atualizado com sucesso",
			device: {
				mac: "AA:BB:CC:DD:EE:20",
				name: "Sensor atualizado",
				warehouseId: "0190f1a0-7b00-7000-8000-000000000020",
				lastMeasurementId: "0190f1a0-7b00-7000-8000-000000000021",
				deviceStatus: "online",
				monitoringStatus: "disabled",
			},
		});
		expect(loadedDevice.name).toBe("Sensor antigo");
	});

	it("atualiza vínculo e status enviados", async () => {
		const devices = createDeviceRepoMock();
		devices.findById.mockResolvedValue(existingDevice());
		const useCase = UpdateDeviceUseCase.instance(devices);
		const warehouseId = "0190f1a0-7b00-7000-8000-000000000022";

		const result = await useCase.execute({
			actorId: "manager-1",
			device: {
				mac: "AA:BB:CC:DD:EE:20",
				warehouseId,
				deviceStatus: "error",
				monitoringStatus: "enabled",
			},
		});

		expect(devices.updateById).toHaveBeenCalledExactlyOnceWith({
			mac: "AA:BB:CC:DD:EE:20",
			warehouseId,
			deviceStatus: "error",
			monitoringStatus: "enabled",
		});
		expect(result.device).toMatchObject({
			warehouseId,
			deviceStatus: "error",
			monitoringStatus: "enabled",
		});
	});

	it("não altera a entidade carregada quando a persistência falha", async () => {
		const devices = createDeviceRepoMock();
		const loadedDevice = existingDevice();
		devices.findById.mockResolvedValue(loadedDevice);
		devices.updateById.mockRejectedValue(new Error("Mongo indisponível"));
		const useCase = UpdateDeviceUseCase.instance(devices);

		await expect(
			useCase.execute({
				actorId: "manager-1",
				device: { mac: "AA:BB:CC:DD:EE:20", name: "Sensor atualizado" },
			}),
		).rejects.toThrow("Mongo indisponível");
		expect(loadedDevice.name).toBe("Sensor antigo");
	});

	it("retorna não encontrado sem atualizar dispositivo inexistente", async () => {
		const devices = createDeviceRepoMock();
		const useCase = UpdateDeviceUseCase.instance(devices);

		await expect(
			useCase.execute({
				actorId: "manager-1",
				device: { mac: "AA:BB:CC:DD:EE:20", name: "Sensor atualizado" },
			}),
		).rejects.toThrow(NotFoundError);
		expect(devices.updateById).not.toHaveBeenCalled();
	});

	it("propaga falha ao persistir a atualização", async () => {
		const devices = createDeviceRepoMock();
		devices.findById.mockResolvedValue(existingDevice());
		devices.updateById.mockRejectedValue(new Error("Mongo indisponível"));
		const useCase = UpdateDeviceUseCase.instance(devices);

		await expect(
			useCase.execute({
				actorId: "manager-1",
				device: { mac: "AA:BB:CC:DD:EE:20", deviceStatus: "offline" },
			}),
		).rejects.toThrow("Mongo indisponível");
	});

	it("reutiliza o singleton com o primeiro repositório", async () => {
		const firstRepo = createDeviceRepoMock();
		const secondRepo = createDeviceRepoMock();
		firstRepo.findById.mockResolvedValue(existingDevice());
		const first = UpdateDeviceUseCase.instance(firstRepo);

		expect(UpdateDeviceUseCase.instance(secondRepo)).toBe(first);
		await first.execute({
			actorId: "manager-1",
			device: { mac: "AA:BB:CC:DD:EE:20", deviceStatus: "offline" },
		});

		expect(firstRepo.updateById).toHaveBeenCalledOnce();
		expect(secondRepo.findById).not.toHaveBeenCalled();
	});
});
