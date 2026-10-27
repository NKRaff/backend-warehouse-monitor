import { CreateDeviceUseCase } from "@application/use-cases/create-device.use-case.js";
import { Device } from "@domain/entities/device.js";
import { ConflictError } from "@shared/errors/conflict-error.js";
import { beforeEach, describe, expect, it } from "vitest";
import { createDeviceRepoMock } from "../../../helpers/mocks.js";
import { resetSingleton } from "../../../helpers/singleton.js";

describe("CreateDeviceUseCase — RF-BE-015/RF-BE-019", () => {
	beforeEach(() => resetSingleton(CreateDeviceUseCase));

	it("cadastra e persiste dispositivo sem armazém", async () => {
		const devices = createDeviceRepoMock();
		const useCase = CreateDeviceUseCase.instance(devices);

		const result = await useCase.execute({
			actorId: "manager-1",
			device: { mac: "AA:BB:CC:DD:EE:FF", name: " Sensor 1 " },
		});

		expect(devices.findById).toHaveBeenCalledExactlyOnceWith("AA:BB:CC:DD:EE:FF");
		expect(devices.save).toHaveBeenCalledExactlyOnceWith(
			expect.objectContaining({
				mac: "AA:BB:CC:DD:EE:FF",
				name: "Sensor 1",
				warehouseId: undefined,
				deviceStatus: "online",
				monitoringStatus: "disabled",
			}),
		);
		expect(result).toEqual({
			message: "Dispositivo cadastrato com sucesso",
			device: {
				mac: "AA:BB:CC:DD:EE:FF",
				name: "Sensor 1",
				deviceStatus: "online",
				monitoringStatus: "disabled",
			},
		});
	});

	it("rejeita MAC já cadastrado sem salvar outro dispositivo", async () => {
		const devices = createDeviceRepoMock();
		devices.findById.mockResolvedValue(
			Device.create({ mac: "AA:BB:CC:DD:EE:FF", name: "Sensor existente" }),
		);
		const useCase = CreateDeviceUseCase.instance(devices);

		await expect(
			useCase.execute({
				actorId: "manager-1",
				device: { mac: "AA:BB:CC:DD:EE:FF", name: "Sensor novo" },
			}),
		).rejects.toThrow(ConflictError);
		expect(devices.save).not.toHaveBeenCalled();
	});

	it("propaga erro do repositório sem persistir", async () => {
		const devices = createDeviceRepoMock();
		devices.findById.mockRejectedValue(new Error("Mongo indisponível"));
		const useCase = CreateDeviceUseCase.instance(devices);

		await expect(
			useCase.execute({
				actorId: "manager-1",
				device: { mac: "AA:BB:CC:DD:EE:FF", name: "Sensor novo" },
			}),
		).rejects.toThrow("Mongo indisponível");
		expect(devices.save).not.toHaveBeenCalled();
	});

	it("reutiliza a instância e o repositório originalmente injetado", async () => {
		const firstRepo = createDeviceRepoMock();
		const secondRepo = createDeviceRepoMock();
		const first = CreateDeviceUseCase.instance(firstRepo);
		const second = CreateDeviceUseCase.instance(secondRepo);

		expect(second).toBe(first);
		await second.execute({
			actorId: "manager-1",
			device: { mac: "AA:BB:CC:DD:EE:FF", name: "Sensor novo" },
		});
		expect(firstRepo.save).toHaveBeenCalledOnce();
		expect(secondRepo.findById).not.toHaveBeenCalled();
	});
});
