import { Notification } from "@domain/entities/notification.js";
import type { NotificationChannel } from "@domain/types/notification-channel.js";
import type { NotificationDocument } from "../models/notification.model.js";

export function notificationToDomain(raw: NotificationDocument): Notification {
	return Notification.restore({
		id: raw._id,
		alertId: raw.alertId,
		recipientId: raw.recipientId,
		channels: raw.channels as NotificationChannel[],
		createdAt: raw.createdAt,
		readedAt: raw.readedAt ?? undefined,
	});
}

export function notificationToPersistence(
	notification: Notification,
): Omit<NotificationDocument, "updatedAt"> {
	return {
		_id: notification.id,
		alertId: notification.alertId,
		recipientId: notification.recipientId,
		channels: notification.channels,
		createdAt: notification.createdAt,
		...(notification.readedAt && { readedAt: notification.readedAt }),
	};
}
