import type { NotificationMessage } from "@application/types/notification-message.js";
import type { NotificationChannel } from "@domain/types/notification-channel.js";

export interface INotificationSender {
	readonly channelType: NotificationChannel;
	send(message: NotificationMessage): Promise<void>;
}
