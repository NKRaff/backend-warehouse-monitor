import type { Email } from "@domain/object-values/email.js";
import type { UserRole } from "@domain/types/user-role.js";
import { UnprocessableEntityError } from "@shared/errors/unprocessable-entity-error.js";

type UserProps = {
	readonly id: string;
	name: string;
	email: Email;
	passwordHashed: string;
	role: UserRole;
	isDefaultPassword: boolean;
	deletedAt?: Date | undefined;
};

export class User {
	private constructor(private props: UserProps) {
		if (this.props.name.length < 4) {
			throw new UnprocessableEntityError(
				"Nome do usuario deve ter no minimo 4 caracteres",
			);
		}
	}

	static create(props: Omit<UserProps, "defaultPassword" | "deletedAt">): User {
		props.name = props.name.trim();
		return new User({ ...props, isDefaultPassword: true });
	}

	static restore(props: UserProps): User {
		return new User(props);
	}

	get id(): string {
		return this.props.id;
	}

	get name(): string {
		return this.props.name;
	}

	get email(): Email {
		return this.props.email;
	}

	get passwordHasher(): string {
		return this.props.passwordHashed;
	}

	get role(): UserRole {
		return this.props.role;
	}

	get isDefaultPassword(): boolean {
		return this.props.isDefaultPassword;
	}

	get deletedAt(): Date | undefined {
		return this.props.deletedAt;
	}
}
