import type { User } from "@domain/entities/user.js";
import type { NotificationChannel } from "../../domain/types/notification-channel.js";

export type NotificationMessage = {
	recipient: User;
	title: string;
	message: string;
	channels: NotificationChannel[];
};
