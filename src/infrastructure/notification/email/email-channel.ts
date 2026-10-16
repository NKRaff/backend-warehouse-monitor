import type { NotificationMessage } from "@application/types/notification-message.js";
import { renderNotificationEmail } from "./email-template-renderer.js";

export interface IEmailTransport {
	send(input: { to: string; subject: string; html: string }): Promise<void>;
}

export class EmailNotificationChannel {
	constructor(private readonly emailTransport: IEmailTransport) {}

	async send(notification: NotificationMessage): Promise<void> {
		if (!notification.channels.includes("email")) {
			return;
		}

		const html = renderNotificationEmail(notification);

		await this.emailTransport.send({
			to: notification.recipient.email.value,
			subject: notification.title,
			html,
		});
	}
}
