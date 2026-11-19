import type {
	ChangeEmailNotificationInputDto,
	ChangeEmailNotificationOutputDto,
} from "@application/dtos/change-email-notification.dto.js";
import type { IUseCase } from "@application/use-cases/use-case.interface.js";
import { ChangeEmailNotificationController } from "@presentation/controllers/change-email-notification.controller.js";
import { UnauthorizedError } from "@shared/errors/unauthorized-error.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetSingleton } from "../../helpers/singleton.js";

describe("ChangeEmailNotificationController — RF-BE-026", () => {
	let execute: ReturnType<
		typeof vi.fn<
			IUseCase<
				ChangeEmailNotificationInputDto,
				ChangeEmailNotificationOutputDto
			>["execute"]
		>
	>;
	let controller: ChangeEmailNotificationController;

	beforeEach(() => {
		resetSingleton(ChangeEmailNotificationController);
		execute = vi
			.fn()
			.mockResolvedValue({ message: "Recebimento de email Ativado" });
		controller = ChangeEmailNotificationController.instance({ execute });
	});

	it("usa o id autenticado e ignora qualquer corpo enviado", async () => {
		await controller.handle({ userId: "outro-usuario" }, { actorId: "user-1" });

		expect(execute).toHaveBeenCalledExactlyOnceWith({ userId: "user-1" });
	});

	it("rejeita contexto sem ator antes de executar o caso de uso", async () => {
		await expect(controller.handle({}, {})).rejects.toBeInstanceOf(
			UnauthorizedError,
		);
		expect(execute).not.toHaveBeenCalled();
	});
});
