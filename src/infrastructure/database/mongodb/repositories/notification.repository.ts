import type { INotificationRepository } from "@application/repositories/notification.interface.js";
import type { Notification } from "@domain/entities/notification.js";
import { notificationToPersistence } from "../mappers/notification.mapper.js";
import { NotificationModel } from "../models/notification.model.js";

export class NotificationRepository implements INotificationRepository {
	private static _instance: NotificationRepository;

	private constructor() {}

	static instance(): NotificationRepository {
		if (!NotificationRepository._instance) {
			NotificationRepository._instance = new NotificationRepository();
		}
		return NotificationRepository._instance;
	}

	async save(notification: Notification): Promise<void> {
		const model = notificationToPersistence(notification);
		await NotificationModel.create(model);
	}
}
