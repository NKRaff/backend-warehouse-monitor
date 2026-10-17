import { GeneratePasswordResetTokenUseCase } from "@application/use-cases/generate-password-reset-token.use-case.js";
import { NotFoundError } from "@shared/errors/not-found-error.js";
import { describe, expect, it } from "vitest";
import { makeUser } from "../../../helpers/factories.js";
import {
	createAlertRepoMock,
	createNotificationRepoMock,
	createNotificationServiceMock,
	createTokenRepoMock,
	createUserRepoMock,
	createUuidProviderMock,
} from "../../../helpers/mocks.js";
import { resetSingleton } from "../../../helpers/singleton.js";
import { Token } from "@domain/entities/token.js";

function setup() {
	resetSingleton(GeneratePasswordResetTokenUseCase);
	const uuidProvider = createUuidProviderMock();
	const userRepo = createUserRepoMock();
	const alertRepo = createAlertRepoMock();
	const notificationRepo = createNotificationRepoMock();
	const tokenRepo = createTokenRepoMock();
	const { service, notify } = createNotificationServiceMock();
	const useCase = GeneratePasswordResetTokenUseCase.instance(
		uuidProvider,
		userRepo,
		alertRepo,
		notificationRepo,
		tokenRepo,
		service,
	);
	return {
		useCase,
		userRepo,
		alertRepo,
		notificationRepo,
		tokenRepo,
		notify,
	};
}

function storedToken(value: string) {
	const token = Token.createPasswordReset("token-1", "user-1");
	token.value = value;
	token.value = token.hash();
	return token;
}

describe("GeneratePasswordResetTokenUseCase — RF-BE-005", () => {
	it("cria e persiste o hash, notificando o usuário com o token em texto puro", async () => {
		const { useCase, userRepo, tokenRepo, alertRepo, notificationRepo, notify } =
			setup();
		const user = makeUser({ id: "user-1" });
		userRepo.findByEmail.mockResolvedValue(user);

		const result = await useCase.execute({ email: "  MARIA@EMPRESA.COM " });

		const token = tokenRepo.save.mock.calls[0]?.[0];
		const message = notify.mock.calls[0]?.[0];
		const plainToken = message?.metadata?.token;
		expect(result.message).toBe("Token de redefinição de senha enviado por email");
		expect(userRepo.findByEmail).toHaveBeenCalledWith("maria@empresa.com");
		expect(token?.type).toBe("password_reset");
		expect(typeof plainToken).toBe("string");
		expect(token?.value).not.toBe(plainToken);
		expect(token?.verify(plainToken as string)).toBe(true);
		expect(token?.isExpired()).toBe(false);
		expect(alertRepo.save).toHaveBeenCalledOnce();
		expect(notificationRepo.save).toHaveBeenCalledOnce();
		expect(message?.recipient).toBe(user);
		expect(message?.channels).toEqual(["email"]);
	});

	it("renova o token existente e invalida o link anterior", async () => {
		const { useCase, userRepo, tokenRepo, notify } = setup();
		const user = makeUser({ id: "user-1" });
		const oldPlainToken = "token-anterior";
		const previousToken = storedToken(oldPlainToken);
		userRepo.findByEmail.mockResolvedValue(user);
		tokenRepo.findByUserAndType.mockResolvedValue(previousToken);

		await useCase.execute({ email: user.email.value });

		const message = notify.mock.calls[0]?.[0];
		const newestPlainToken = message?.metadata?.token as string;
		expect(tokenRepo.save).not.toHaveBeenCalled();
		expect(tokenRepo.updateToken).toHaveBeenCalledExactlyOnceWith(
			previousToken.id,
			previousToken.value,
			previousToken.expiresAt,
		);
		expect(previousToken.verify(newestPlainToken)).toBe(true);
		expect(previousToken.verify(oldPlainToken)).toBe(false);
		expect(previousToken.isExpired()).toBe(false);
	});

	it("retorna 404 para e-mail inexistente sem criar token, alerta ou notificação", async () => {
		const { useCase, tokenRepo, alertRepo, notificationRepo, notify } = setup();

		await expect(
			useCase.execute({ email: "inexistente@empresa.com" }),
		).rejects.toThrow(NotFoundError);
		expect(tokenRepo.save).not.toHaveBeenCalled();
		expect(tokenRepo.updateToken).not.toHaveBeenCalled();
		expect(alertRepo.save).not.toHaveBeenCalled();
		expect(notificationRepo.save).not.toHaveBeenCalled();
		expect(notify).not.toHaveBeenCalled();
	});

	it("não espera o envio do e-mail terminar para responder", async () => {
		const { useCase, userRepo, notify } = setup();
		userRepo.findByEmail.mockResolvedValue(makeUser());
		notify.mockReturnValueOnce(new Promise<void>(() => {}));

		await expect(
			useCase.execute({ email: "maria@empresa.com" }),
		).resolves.toEqual({
			message: "Token de redefinição de senha enviado por email",
		});
		expect(notify).toHaveBeenCalledOnce();
	});
});
