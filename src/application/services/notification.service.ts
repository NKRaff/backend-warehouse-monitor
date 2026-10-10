import type { INotificationSender } from "@application/ports/notification-sender.interface.js";
import type { NotificationMessage } from "@application/types/notification-message.js";

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
		const selectedChannels = this.channels.filter((channel) =>
			message.channels.includes(channel.channelType),
		);

		await Promise.all(selectedChannels.map((channel) => channel.send(message)));
	}
}
