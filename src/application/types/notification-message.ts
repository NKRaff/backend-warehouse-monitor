import type { User } from "@domain/entities/user.js";
import type { AlertSeverity } from "@domain/types/alert-severity.js";
import type { AlertStatus } from "@domain/types/alert-status.js";
import type { AlertType } from "@domain/types/alert-type.js";
import type { NotificationChannel } from "../../domain/types/notification-channel.js";

export type NotificationMessage = {
	recipient: User;
	title: string;
	message: string;
	type: AlertType;
	severity: AlertSeverity;
	status: AlertStatus;
	channels: NotificationChannel[];
};
