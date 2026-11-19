import type { INotificationSender } from "@application/ports/notification-sender.interface.js";
import { NotificationService } from "@application/services/notification.service.js";
import type { NotificationChannel } from "@domain/types/notification-channel.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeNotificationMessage } from "../../../helpers/factories.js";
import { resetSingleton } from "../../../helpers/singleton.js";

function createSender(channelType: NotificationChannel) {
	return {
		channelType,
		send: vi.fn<INotificationSender["send"]>().mockResolvedValue(undefined),
	} satisfies INotificationSender;
}

describe("NotificationService — RF-BE-025/026", () => {
	beforeEach(() => {
		resetSingleton(NotificationService);
	});

	it("envia apenas pelos canais solicitados na mensagem", async () => {
		const email = createSender("email");
		const inApp = createSender("in_app");
		const service = NotificationService.instance([email, inApp]);
		const message = makeNotificationMessage({ channels: ["email"] });

		await service.notify(message);

		expect(email.send).toHaveBeenCalledExactlyOnceWith(message);
		expect(inApp.send).not.toHaveBeenCalled();
	});

	it("envia por todos os canais solicitados", async () => {
		const email = createSender("email");
		const inApp = createSender("in_app");
		const service = NotificationService.instance([email, inApp]);
		const message = makeNotificationMessage({ channels: ["email", "in_app"] });

		await service.notify(message);

		expect(email.send).toHaveBeenCalledWith(message);
		expect(inApp.send).toHaveBeenCalledWith(message);
	});

	it("não faz nada quando nenhum canal registrado atende à mensagem", async () => {
		const email = createSender("email");
		const service = NotificationService.instance([email]);

		await expect(
			service.notify(makeNotificationMessage({ channels: ["in_app"] })),
		).resolves.toBeUndefined();

		expect(email.send).not.toHaveBeenCalled();
	});

	it("não faz nada quando a mensagem não pede nenhum canal", async () => {
		const email = createSender("email");
		const service = NotificationService.instance([email]);

		await service.notify(makeNotificationMessage({ channels: [] }));

		expect(email.send).not.toHaveBeenCalled();
	});

	it("respeita a preferência desativada para alertas por e-mail e mantém o canal interno", async () => {
		const email = createSender("email");
		const inApp = createSender("in_app");
		const service = NotificationService.instance([email, inApp]);
		const message = makeNotificationMessage({ channels: ["email", "in_app"] });
		message.recipient.email.changeNotification();

		await service.notify(message);

		expect(email.send).not.toHaveBeenCalled();
		expect(inApp.send).toHaveBeenCalledExactlyOnceWith(message);
	});

	it("envia redefinição de senha mesmo com notificações de alerta desativadas", async () => {
		const email = createSender("email");
		const service = NotificationService.instance([email]);
		const message = makeNotificationMessage({
			type: "password_reset",
			channels: ["email"],
		});
		message.recipient.email.changeNotification();

		await service.notify(message);

		expect(email.send).toHaveBeenCalledExactlyOnceWith(message);
	});

	it("propaga a falha de um canal para quem chamou", async () => {
		const email = createSender("email");
		email.send.mockRejectedValue(new Error("SMTP indisponível"));
		const service = NotificationService.instance([email]);

		await expect(service.notify(makeNotificationMessage())).rejects.toThrow(
			"SMTP indisponível",
		);
	});

	it("é um Singleton: a segunda chamada reaproveita a primeira instância", () => {
		const first = NotificationService.instance([createSender("email")]);
		const second = NotificationService.instance([createSender("in_app")]);

		expect(second).toBe(first);
	});
});
