import type { Notification } from "@domain/entities/notification.js";

export interface INotificationRepository {
	save(notification: Notification): Promise<void>;
}
