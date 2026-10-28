import type {
	UpdateDeviceInputDto,
	UpdateDeviceOutputDto,
} from "@application/dtos/update-device.dto.js";
import type { IUseCase } from "@application/use-cases/use-case.interface.js";
import { UpdateDeviceController } from "@presentation/controllers/update-device.controller.js";
import { UnauthorizedError } from "@shared/errors/unauthorized-error.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";
import { resetSingleton } from "../../helpers/singleton.js";

describe("UpdateDeviceController — RF-BE-016", () => {
	let execute: ReturnType<
		typeof vi.fn<
			IUseCase<UpdateDeviceInputDto, UpdateDeviceOutputDto>["execute"]
		>
	>;
	let controller: UpdateDeviceController;

	beforeEach(() => {
		resetSingleton(UpdateDeviceController);
		execute = vi.fn<
			IUseCase<UpdateDeviceInputDto, UpdateDeviceOutputDto>["execute"]
		>();
		controller = UpdateDeviceController.instance({ execute });
	});

	it("normaliza o nome antes de encaminhar os dados ao caso de uso", async () => {
		await controller.handle(
			{ mac: "AA:BB:CC:DD:EE:20", name: "  Sensor atualizado  " },
			{ actorId: "manager-1" },
		);

		expect(execute).toHaveBeenCalledExactlyOnceWith({
			actorId: "manager-1",
			device: { mac: "AA:BB:CC:DD:EE:20", name: "Sensor atualizado" },
		});
	});

	it("rejeita nome curto após trim sem executar o caso de uso", async () => {
		await expect(
			controller.handle(
				{ mac: "AA:BB:CC:DD:EE:20", name: "  a " },
				{ actorId: "manager-1" },
			),
		).rejects.toBeInstanceOf(ZodError);
		expect(execute).not.toHaveBeenCalled();
	});

	it("exige ator no contexto", async () => {
		await expect(
			controller.handle({ mac: "AA:BB:CC:DD:EE:20", name: "Sensor novo" }, {}),
		).rejects.toThrow(UnauthorizedError);
		expect(execute).not.toHaveBeenCalled();
	});
});
