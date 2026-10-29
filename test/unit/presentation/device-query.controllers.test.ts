import type {
	GetDeviceInputDto,
	GetDeviceOutputDto,
} from "@application/dtos/get-device.dto.js";
import type {
	ListAllDeviceInputDto,
	ListAllDeviceOutputDto,
} from "@application/dtos/list-all-device.dto.js";
import type { IUseCase } from "@application/use-cases/use-case.interface.js";
import { GetDeviceController } from "@presentation/controllers/get-device.controller.js";
import { ListAllDeviceController } from "@presentation/controllers/list-all-device.controller.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";
import { resetSingleton } from "../../helpers/singleton.js";

describe("GetDeviceController", () => {
	let execute: ReturnType<
		typeof vi.fn<IUseCase<GetDeviceInputDto, GetDeviceOutputDto>["execute"]>
	>;
	let controller: GetDeviceController;

	beforeEach(() => {
		resetSingleton(GetDeviceController);
		execute = vi.fn().mockResolvedValue({
			message: "Dispositivo encontrado",
			device: {
				mac: "AA:BB:CC:DD:EE:50",
				name: "Sensor sala fria",
				deviceStatus: "online",
				monitoringStatus: "enabled",
			},
		});
		controller = GetDeviceController.instance({ execute });
	});

	it("valida e encaminha o MAC consultado", async () => {
		await controller.handle({ deviceMac: "AA:BB:CC:DD:EE:50" }, {});
		expect(execute).toHaveBeenCalledWith({ deviceMac: "AA:BB:CC:DD:EE:50" });
	});

	it("rejeita MAC inválido antes de consultar o caso de uso", async () => {
		await expect(
			controller.handle({ deviceMac: "inválido" }, {}),
		).rejects.toBeInstanceOf(ZodError);
		expect(execute).not.toHaveBeenCalled();
	});
});

describe("ListAllDeviceController", () => {
	let execute: ReturnType<
		typeof vi.fn<
			IUseCase<ListAllDeviceInputDto, ListAllDeviceOutputDto>["execute"]
		>
	>;
	let controller: ListAllDeviceController;

	beforeEach(() => {
		resetSingleton(ListAllDeviceController);
		execute = vi.fn().mockResolvedValue({
			message: "Lista de dispositivos encontrada",
			devices: [],
		});
		controller = ListAllDeviceController.instance({ execute });
	});

	it("converte os parâmetros de paginação da query para números", async () => {
		await controller.handle({ offSet: "5", limit: "10" }, {});
		expect(execute).toHaveBeenCalledWith({ offSet: 5, limit: 10 });
	});

	it("rejeita parâmetros de paginação que não podem ser convertidos", async () => {
		await expect(
			controller.handle({ offSet: "abc", limit: "10" }, {}),
		).rejects.toBeInstanceOf(ZodError);
		expect(execute).not.toHaveBeenCalled();
	});
});
