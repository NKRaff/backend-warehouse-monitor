import { BootstrapMonitoringDeviceUseCase } from "@application/use-cases/bootstrap-monitoring-device.use-case.js";
import { Device } from "@domain/entities/device.js";
import { beforeEach, describe, expect, it } from "vitest";
import {
	createDeviceRepoMock,
	createMqttClientMock,
} from "../../../helpers/mocks.js";
import { resetSingleton } from "../../../helpers/singleton.js";

describe("BootstrapMonitoringDeviceUseCase — RF-BE-020", () => {
	let deviceRepo: ReturnType<typeof createDeviceRepoMock>;
	let mqttClient: ReturnType<typeof createMqttClientMock>;
	let useCase: BootstrapMonitoringDeviceUseCase;

	beforeEach(() => {
		resetSingleton(BootstrapMonitoringDeviceUseCase);
		deviceRepo = createDeviceRepoMock();
		mqttClient = createMqttClientMock();
		useCase = BootstrapMonitoringDeviceUseCase.instance(deviceRepo, mqttClient);
	});

	it("restaura as inscrições de telemetria e erro dos dispositivos selecionados", async () => {
		deviceRepo.findAllMonitoringOn.mockResolvedValue([
			Device.restore({
				mac: "AA:BB:CC:DD:EE:71",
				name: "Sensor da câmara",
				warehouseId: "0190f1a0-7b00-7000-8000-000000000071",
				deviceStatus: "online",
				monitoringStatus: "enabled",
			}),
			Device.restore({
				mac: "AA:BB:CC:DD:EE:72",
				name: "Sensor do depósito",
				warehouseId: "0190f1a0-7b00-7000-8000-000000000072",
				deviceStatus: "offline",
				monitoringStatus: "enabled",
			}),
		]);

		await useCase.execute();

		expect(deviceRepo.findAllMonitoringOn).toHaveBeenCalledOnce();
		expect(mqttClient.subscribe).toHaveBeenNthCalledWith(
			1,
			"device/AA:BB:CC:DD:EE:71/telemetry",
		);
		expect(mqttClient.subscribe).toHaveBeenNthCalledWith(
			2,
			"device/AA:BB:CC:DD:EE:71/error",
		);
		expect(mqttClient.subscribe).toHaveBeenNthCalledWith(
			3,
			"device/AA:BB:CC:DD:EE:72/telemetry",
		);
		expect(mqttClient.subscribe).toHaveBeenNthCalledWith(
			4,
			"device/AA:BB:CC:DD:EE:72/error",
		);
	});

	it("não tenta inscrições quando não há dispositivos monitorados", async () => {
		await useCase.execute();

		expect(deviceRepo.findAllMonitoringOn).toHaveBeenCalledOnce();
		expect(mqttClient.subscribe).not.toHaveBeenCalled();
	});

	it("propaga falha ao consultar dispositivos", async () => {
		deviceRepo.findAllMonitoringOn.mockRejectedValue(
			new Error("Mongo indisponível"),
		);

		await expect(useCase.execute()).rejects.toThrow("Mongo indisponível");
		expect(mqttClient.subscribe).not.toHaveBeenCalled();
	});

	it("reutiliza o singleton com as dependências da primeira instância", () => {
		const otherRepo = createDeviceRepoMock();
		const otherMqttClient = createMqttClientMock();

		expect(
			BootstrapMonitoringDeviceUseCase.instance(otherRepo, otherMqttClient),
		).toBe(useCase);
	});
});
