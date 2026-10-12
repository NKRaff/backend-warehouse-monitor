import type { AuditAction } from "@domain/types/audit-action.js";
import type { AuditResource } from "@domain/types/audit-resource.js";

type AuditLogProps = {
	readonly id: string;
	readonly actorId: string;
	readonly action: AuditAction;
	readonly resourceId: string;
	readonly resourceType: AuditResource;
	readonly metadata?: Record<string, unknown> | undefined;
	readonly createdAt: Date;
};

export class AuditLog {
	private constructor(private props: AuditLogProps) {}

	static create(
		props: AuditLogProps & Partial<Pick<AuditLogProps, "actorId">>,
	): AuditLog {
		return new AuditLog({
			...props,
			actorId: props.actorId ?? "system",
		});
	}

	static restore(props: AuditLogProps): AuditLog {
		return new AuditLog(props);
	}

	get id(): string {
		return this.props.id;
	}

	get actorId(): string {
		return this.props.actorId;
	}

	get action(): AuditAction {
		return this.props.action;
	}

	get resourceId(): string {
		return this.props.resourceId;
	}

	get resourceType(): AuditResource {
		return this.props.resourceType;
	}

	get metadata(): Record<string, unknown> | undefined {
		return this.props.metadata;
	}

	get createdAt(): Date {
		return this.props.createdAt;
	}
}
