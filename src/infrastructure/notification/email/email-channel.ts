import type { SmtpClient } from "@application/ports/smtp-client.interface.js";
import type { NotificationMessage } from "@application/types/notification-message.js";
import type { NotificationChannel } from "@domain/types/notification-channel.js";
import { renderNotificationEmail } from "./email-template-renderer.js";

export class EmailNotificationChannel {
	private static _instance: EmailNotificationChannel;
	private _channelType: NotificationChannel = "email";

	private constructor(private readonly mailer: SmtpClient) {}

	static instance(mailer: SmtpClient) {
		if (!EmailNotificationChannel._instance) {
			EmailNotificationChannel._instance = new EmailNotificationChannel(mailer);
		}
		return EmailNotificationChannel._instance;
	}

	async send(notification: NotificationMessage): Promise<void> {
		if (!notification.channels.includes("email")) {
			return;
		}

		const html = renderNotificationEmail(notification);

		await this.mailer.sendMail({
			to: notification.recipient.email.value,
			subject: notification.title,
			html,
		});
	}

	get channelType(): NotificationChannel {
		return this._channelType;
	}
}
