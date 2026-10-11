type NotificationProps = {
	readonly id: string;
	readonly alertId: string;
	readonly recipientId: string;
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

	get id(): string {
		return this.props.id;
	}

	get alertId(): string {
		return this.props.alertId;
	}

	get recipientId(): string {
		return this.props.recipientId;
	}

	get createdAt(): Date {
		return this.props.createdAt;
	}

	get readedAt(): Date | undefined {
		return this.props.readedAt;
	}
}
