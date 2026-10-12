import type { INotificationSender } from "@application/ports/notification-sender.interface.js";
import type { SmtpClient } from "@application/ports/smtp-client.interface.js";
import type { NotificationMessage } from "@application/types/notification-message.js";
import type { NotificationChannel } from "@domain/types/notification-channel.js";
import { renderAlertEmailHtml } from "./templates/alert-email.template.js";
import { renderWelcomeEmailHtml } from "./templates/welcome-email.template.js";

export class EmailChannel implements INotificationSender {
	private static _instance: EmailChannel;
	private _channelType: NotificationChannel = "email";

	private constructor(private mailer: SmtpClient) {}

	static instance(mailer: SmtpClient) {
		if (!EmailChannel._instance) {
			EmailChannel._instance = new EmailChannel(mailer);
		}
		return EmailChannel._instance;
	}

	async send(message: NotificationMessage): Promise<void> {
		let htmlContent: string;
		if (message.type === "register_user") {
			htmlContent = renderWelcomeEmailHtml(message);
		} else {
			htmlContent = renderAlertEmailHtml(message);
		}

		await this.mailer.sendMail({
			to: message.recipient.email.value,
			subject: message.title,
			html: htmlContent,
			text: message.message,
		});
	}

	get channelType(): NotificationChannel {
		return this._channelType;
	}
}
