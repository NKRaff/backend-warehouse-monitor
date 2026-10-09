import type { AlertSeverity } from "@domain/types/alert-severity.js";
import type { AlertStatus } from "@domain/types/alert-status.js";
import type { AlertType } from "@domain/types/alert-type.js";
import { ConflictError } from "@shared/errors/conflict-error.js";
import type { User } from "./user.js";

type AlertProps = {
	readonly id: string;
	readonly type: AlertType;
	readonly severity: AlertSeverity;
	readonly title: string;
	readonly description: string;
	readonly occurredAt: Date;
	status: AlertStatus;
	resolvedAt?: Date;
	resolvedBy?: User;
};

export class Alert {
	private constructor(private props: AlertProps) {}

	static create(
		props: Omit<AlertProps, "status" | "resolvedAt" | "resolvedBy"> &
			Partial<Pick<AlertProps, "occurredAt">>,
	): Alert {
		return new Alert({
			...props,
			title: props.title.trim(),
			description: props.description.trim(),
			status: "active",
			occurredAt: props.occurredAt ?? new Date(),
		});
	}

	static restore(props: AlertProps): Alert {
		return new Alert(props);
	}

	resolve(user: User, resolvedAt: Date) {
		if (this.props.status === "resolved") {
			throw new ConflictError("O alerta ja foi resolvido");
		}

		this.props.status = "resolved";
		this.props.resolvedAt = resolvedAt;
		this.props.resolvedBy = user;
	}

	get id(): string {
		return this.props.id;
	}

	get type(): AlertType {
		return this.props.type;
	}

	get severity(): AlertSeverity {
		return this.props.severity;
	}

	get title(): string {
		return this.props.title;
	}

	get description(): string {
		return this.props.description;
	}

	get occurredAt(): Date {
		return this.props.occurredAt;
	}

	get resolvedAt(): Date | undefined {
		return this.props.resolvedAt;
	}

	get resolvedBy(): User | undefined {
		return this.props.resolvedBy;
	}
}
