import type {
	DeleteDeviceInputDto,
	DeleteDeviceOutputDto,
} from "@application/dtos/delete-device.dto.js";
import type { IUseCase } from "@application/use-cases/use-case.interface.js";
import { DeleteDeviceController } from "@presentation/controllers/delete-device.controller.js";
import { UnauthorizedError } from "@shared/errors/unauthorized-error.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";
import { resetSingleton } from "../../helpers/singleton.js";

describe("DeleteDeviceController", () => {
	let execute: ReturnType<
		typeof vi.fn<
			IUseCase<DeleteDeviceInputDto, DeleteDeviceOutputDto>["execute"]
		>
	>;
	let controller: DeleteDeviceController;

	beforeEach(() => {
		resetSingleton(DeleteDeviceController);
		execute = vi
			.fn()
			.mockResolvedValue({ message: "Dispositivo excluido com sucesso" });
		controller = DeleteDeviceController.instance({ execute });
	});

	it("valida o MAC e encaminha o ator junto ao caso de uso", async () => {
		await expect(
			controller.handle(
				{ deviceId: "AA:BB:CC:DD:EE:30" },
				{ actorId: "manager-1" },
			),
		).resolves.toEqual({ message: "Dispositivo excluido com sucesso" });

		expect(execute).toHaveBeenCalledWith({
			actorId: "manager-1",
			deviceId: "AA:BB:CC:DD:EE:30",
		});
	});

	it("rejeita MAC inválido antes de chamar o caso de uso", async () => {
		await expect(
			controller.handle({ deviceId: "MAC-inválido" }, { actorId: "manager-1" }),
		).rejects.toBeInstanceOf(ZodError);

		expect(execute).not.toHaveBeenCalled();
	});

	it("exige o identificador do ator", async () => {
		await expect(
			controller.handle({ deviceId: "AA:BB:CC:DD:EE:30" }, {}),
		).rejects.toBeInstanceOf(UnauthorizedError);

		expect(execute).not.toHaveBeenCalled();
	});
});
