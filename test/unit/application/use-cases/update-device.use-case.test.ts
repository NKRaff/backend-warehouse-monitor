import { UpdateDeviceUseCase } from "@application/use-cases/update-device.use-case.js";
import { Device } from "@domain/entities/device.js";
import { NotFoundError } from "@shared/errors/not-found-error.js";
import { beforeEach, describe, expect, it } from "vitest";
import {
	createDeviceRepoMock,
	createMqttClientMock,
} from "../../../helpers/mocks.js";
import { resetSingleton } from "../../../helpers/singleton.js";

const existingDevice = (monitoringStatus: "disabled" | "enabled" = "disabled") =>
	Device.restore({
		mac: "AA:BB:CC:DD:EE:20",
		name: "Sensor antigo",
		warehouseId: "0190f1a0-7b00-7000-8000-000000000020",
		lastMeasurementId: "0190f1a0-7b00-7000-8000-000000000021",
		deviceStatus: "online",
		monitoringStatus,
	});

describe("UpdateDeviceUseCase — RF-BE-016", () => {
	let mqttClient: ReturnType<typeof createMqttClientMock>;

	beforeEach(() => {
		resetSingleton(UpdateDeviceUseCase);
		mqttClient = createMqttClientMock();
	});

	it("atualiza parcialmente preservando campos omitidos e a entidade carregada", async () => {
		const devices = createDeviceRepoMock();
		const loadedDevice = existingDevice();
		devices.findById.mockResolvedValue(loadedDevice);
		const useCase = UpdateDeviceUseCase.instance(devices, mqttClient);

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
		expect(mqttClient.subscribe).not.toHaveBeenCalled();
		expect(mqttClient.unsubscribe).not.toHaveBeenCalled();
	});

	it("atualiza vínculo e status enviados", async () => {
		const devices = createDeviceRepoMock();
		devices.findById.mockResolvedValue(existingDevice());
		const useCase = UpdateDeviceUseCase.instance(devices, mqttClient);
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
		expect(mqttClient.subscribe).toHaveBeenNthCalledWith(
			1,
			"device/AA:BB:CC:DD:EE:20/telemetry",
		);
		expect(mqttClient.subscribe).toHaveBeenNthCalledWith(
			2,
			"device/AA:BB:CC:DD:EE:20/error",
		);
		expect(mqttClient.unsubscribe).not.toHaveBeenCalled();
	});

	it("remove as inscrições ao desativar o monitoramento", async () => {
		const devices = createDeviceRepoMock();
		devices.findById.mockResolvedValue(existingDevice("enabled"));
		const useCase = UpdateDeviceUseCase.instance(devices, mqttClient);

		await useCase.execute({
			actorId: "manager-1",
			device: {
				mac: "AA:BB:CC:DD:EE:20",
				monitoringStatus: "disabled",
			},
		});

		expect(mqttClient.unsubscribe).toHaveBeenNthCalledWith(
			1,
			"device/AA:BB:CC:DD:EE:20/telemetry",
		);
		expect(mqttClient.unsubscribe).toHaveBeenNthCalledWith(
			2,
			"device/AA:BB:CC:DD:EE:20/error",
		);
		expect(mqttClient.subscribe).not.toHaveBeenCalled();
	});

	it("não sincroniza MQTT quando o estado de monitoramento não muda", async () => {
		const devices = createDeviceRepoMock();
		devices.findById.mockResolvedValue(existingDevice("enabled"));
		const useCase = UpdateDeviceUseCase.instance(devices, mqttClient);

		await useCase.execute({
			actorId: "manager-1",
			device: { mac: "AA:BB:CC:DD:EE:20", name: "Sensor atualizado" },
		});

		expect(mqttClient.subscribe).not.toHaveBeenCalled();
		expect(mqttClient.unsubscribe).not.toHaveBeenCalled();
	});

	it("propaga falha MQTT antes de persistir a alteração no banco", async () => {
		const devices = createDeviceRepoMock();
		devices.findById.mockResolvedValue(existingDevice());
		mqttClient.subscribe.mockRejectedValue(new Error("Broker indisponível"));
		const useCase = UpdateDeviceUseCase.instance(devices, mqttClient);

		await expect(
			useCase.execute({
				actorId: "manager-1",
				device: {
					mac: "AA:BB:CC:DD:EE:20",
					monitoringStatus: "enabled",
				},
			}),
		).rejects.toThrow("Broker indisponível");
		expect(mqttClient.subscribe).toHaveBeenCalledExactlyOnceWith(
			"device/AA:BB:CC:DD:EE:20/telemetry",
		);
		expect(devices.updateById).not.toHaveBeenCalled();
	});

	it("não altera a entidade carregada quando a persistência falha", async () => {
		const devices = createDeviceRepoMock();
		const loadedDevice = existingDevice();
		devices.findById.mockResolvedValue(loadedDevice);
		devices.updateById.mockRejectedValue(new Error("Mongo indisponível"));
		const useCase = UpdateDeviceUseCase.instance(devices, mqttClient);

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
		const useCase = UpdateDeviceUseCase.instance(devices, mqttClient);

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
		const useCase = UpdateDeviceUseCase.instance(devices, mqttClient);

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
		const first = UpdateDeviceUseCase.instance(firstRepo, mqttClient);

		expect(UpdateDeviceUseCase.instance(secondRepo, createMqttClientMock())).toBe(
			first,
		);
		await first.execute({
			actorId: "manager-1",
			device: { mac: "AA:BB:CC:DD:EE:20", deviceStatus: "offline" },
		});

		expect(firstRepo.updateById).toHaveBeenCalledOnce();
		expect(secondRepo.findById).not.toHaveBeenCalled();
	});
});
