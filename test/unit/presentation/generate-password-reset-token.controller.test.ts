import type { GeneratePasswordResetTokenInputDto, GeneratePasswordResetTokenOutputDto } from "@application/dtos/generate-password-reset-token.dto.js";
import type { IUseCase } from "@application/use-cases/use-case.interface.js";
import { GeneratePasswordResetTokenController } from "@presentation/controllers/generate-password-reset-token.controller.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";
import { resetSingleton } from "../../helpers/singleton.js";

describe("GeneratePasswordResetTokenController — RF-BE-005", () => {
	const output: GeneratePasswordResetTokenOutputDto = {
		message: "Token de redefinição de senha enviado por email",
	};
	let useCase: IUseCase<
		GeneratePasswordResetTokenInputDto,
		GeneratePasswordResetTokenOutputDto
	>;
	let controller: GeneratePasswordResetTokenController;

	beforeEach(() => {
		resetSingleton(GeneratePasswordResetTokenController);
		useCase = {
			execute: vi
				.fn<IUseCase<GeneratePasswordResetTokenInputDto, GeneratePasswordResetTokenOutputDto>["execute"]>()
				.mockResolvedValue(output),
		};
		controller = GeneratePasswordResetTokenController.instance(useCase);
	});

	it("valida o e-mail e delega sem exigir sessão", async () => {
		await expect(
			controller.handle({ email: "maria@empresa.com" }, {}),
		).resolves.toBe(output);
		expect(useCase.execute).toHaveBeenCalledExactlyOnceWith({
			email: "maria@empresa.com",
		});
	});

	it("rejeita e-mail inválido sem chamar o caso de uso", async () => {
		await expect(controller.handle({ email: "inválido" }, {})).rejects.toBeInstanceOf(
			ZodError,
		);
		expect(useCase.execute).not.toHaveBeenCalled();
	});

	it("rejeita corpo ausente", async () => {
		await expect(controller.handle(undefined, {})).rejects.toBeInstanceOf(ZodError);
		expect(useCase.execute).not.toHaveBeenCalled();
	});
});
