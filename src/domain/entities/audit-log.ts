import type { AuditAction } from "@domain/types/audit-action.js";
import type { AuditResource } from "@domain/types/audit-resource.js";
import type { User } from "./user.js";

type AuditLogProps = {
	readonly id: string;
	readonly actor: User | "system";
	readonly action: AuditAction;
	readonly resource: string;
	readonly resourceType: AuditResource;
	readonly metadata?: Record<string, unknown>;
	readonly createdAt: Date;
};

export class AuditLog {
	private constructor(private props: AuditLogProps) {}

	static create(
		props: AuditLogProps & Partial<Pick<AuditLogProps, "actor">>,
	): AuditLog {
		return new AuditLog({
			...props,
			actor: props.actor ?? "system",
		});
	}

	static restore(props: AuditLogProps): AuditLog {
		return new AuditLog(props);
	}

	get id(): string {
		return this.props.id;
	}

	get actor(): User | string {
		return this.props.actor;
	}

	get action(): AuditAction {
		return this.props.action;
	}

	get resource(): string {
		return this.props.resource;
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
