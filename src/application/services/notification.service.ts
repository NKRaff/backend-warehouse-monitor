import type { INotificationSender } from "@application/ports/notification-sender.interface.js";
import type { NotificationMessage } from "@application/types/notification-message.js";
import { AlertType } from "@domain/types/alert-type.js";

export class NotificationService {
	private static _instance: NotificationService;

	private constructor(private readonly channels: INotificationSender[]) {}

	static instance(channels: INotificationSender[]): NotificationService {
		if (!NotificationService._instance) {
			NotificationService._instance = new NotificationService(channels);
		}
		return NotificationService._instance;
	}

	async notify(message: NotificationMessage): Promise<void> {
		const alertTypes = new Set<string>([
			AlertType.DEVICE_OFFLINE,
			AlertType.DEVICE_ERROR,
			AlertType.MEASUREMENT_OUR_OF_LIMITS,
		]);
		const shouldSendEmail =
			!alertTypes.has(message.type) ||
			message.recipient.email.enableNotification;
		const selectedChannels = this.channels.filter(
			(channel) =>
				message.channels.includes(channel.channelType) &&
				(channel.channelType !== "email" || shouldSendEmail),
		);

		await Promise.all(selectedChannels.map((channel) => channel.send(message)));
	}
}
