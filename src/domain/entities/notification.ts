import type { Alert } from "./alert.js";
import type { User } from "./user.js";

type NotificationProps = {
	readonly id: string;
	readonly alert: Alert;
	readonly recipient: User;
	readonly createdAt: Date;
	readedAt?: Date;
};

export class Notification {
	private constructor(private props: NotificationProps) {}

	static create(props: NotificationProps): Notification {
		return new Notification(props);
	}

	static restore(props: NotificationProps): Notification {
		return new Notification(props);
	}
}
