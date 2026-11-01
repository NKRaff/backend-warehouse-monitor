import { GetDeviceUseCase } from "@application/use-cases/get-device.use-case.js";
import { ListAllDeviceUseCase } from "@application/use-cases/list-all-devices.use-case.js";
import { Device } from "@domain/entities/device.js";
import { NotFoundError } from "@shared/errors/not-found-error.js";
import { beforeEach, describe, expect, it } from "vitest";
import { createDeviceRepoMock } from "../../../helpers/mocks.js";
import { resetSingleton } from "../../../helpers/singleton.js";

describe("GetDeviceUseCase — RF-BE-018", () => {
	const deviceMac = "AA:BB:CC:DD:EE:50";
	let deviceRepo: ReturnType<typeof createDeviceRepoMock>;
	let useCase: GetDeviceUseCase;

	beforeEach(() => {
		resetSingleton(GetDeviceUseCase);
		deviceRepo = createDeviceRepoMock();
		useCase = GetDeviceUseCase.instance(deviceRepo);
	});

	it("devolve os dados do dispositivo e sua última medição disponível", async () => {
		deviceRepo.findById.mockResolvedValue(
			Device.restore({
				mac: deviceMac,
				name: "Sensor sala fria",
				warehouseId: "0190f1a0-7b00-7000-8000-000000000050",
				lastMeasurementId: {
					humidityId: "0190f1a0-7b00-7000-8000-000000000051",
					temperatureId: "0190f1a0-7b00-7000-8000-000000000051",
				},
				deviceStatus: "online",
				monitoringStatus: "enabled",
			}),
		);

		await expect(useCase.execute({ deviceMac })).resolves.toMatchObject({
			message: "Dispositivo encontrado",
			device: {
				mac: deviceMac,
				name: "Sensor sala fria",
				warehouseId: "0190f1a0-7b00-7000-8000-000000000050",
				lastMeasurementId: {
					humidityId: "0190f1a0-7b00-7000-8000-000000000051",
					temperatureId: "0190f1a0-7b00-7000-8000-000000000051",
				},
				deviceStatus: "online",
				monitoringStatus: "enabled",
			},
		});
		expect(deviceRepo.findById).toHaveBeenCalledWith(deviceMac);
	});

	it("omite vínculo e última medição quando não existem", async () => {
		deviceRepo.findById.mockResolvedValue(
			Device.create({ mac: deviceMac, name: "Sensor sem dados" }),
		);

		const result = await useCase.execute({ deviceMac });

		expect(result.device).not.toHaveProperty("warehouseId");
		expect(result.device).not.toHaveProperty("lastMeasurementId");
	});

	it("retorna não encontrado quando o MAC não existe", async () => {
		await expect(useCase.execute({ deviceMac })).rejects.toBeInstanceOf(
			NotFoundError,
		);
	});
});

describe("ListAllDeviceUseCase — RF-BE-018", () => {
	let deviceRepo: ReturnType<typeof createDeviceRepoMock>;
	let useCase: ListAllDeviceUseCase;

	beforeEach(() => {
		resetSingleton(ListAllDeviceUseCase);
		deviceRepo = createDeviceRepoMock();
		useCase = ListAllDeviceUseCase.instance(deviceRepo);
	});

	it("encaminha a paginação e devolve os dispositivos encontrados", async () => {
		const devices = [
			Device.create({ mac: "AA:BB:CC:DD:EE:52", name: "Sensor depósito" }),
		];
		deviceRepo.findAll.mockResolvedValue(devices);

		const result = await useCase.execute({ offSet: 2, limit: 5 });

		expect(deviceRepo.findAll).toHaveBeenCalledWith(2, 5);
		expect(result).toEqual({
			message: "Lista de dispositivos encontrada",
			devices: [
				{
					mac: "AA:BB:CC:DD:EE:52",
					name: "Sensor depósito",
					deviceStatus: "online",
					monitoringStatus: "disabled",
				},
			],
		});
	});

	it("devolve lista vazia quando não há dispositivos", async () => {
		await expect(
			useCase.execute({ offSet: 0, limit: 10 }),
		).resolves.toMatchObject({
			devices: [],
		});
	});
});
