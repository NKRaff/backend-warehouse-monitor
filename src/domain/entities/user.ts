import type { Email } from "@domain/object-values/email.js";
import type { UserRole } from "@domain/types/user-role.js";
import { UnprocessableEntityError } from "@shared/errors/unprocessable-entity-error.js";

type UserProps = {
	readonly id: string;
	name: string;
	email: Email;
	passwordHashed: string;
	role: UserRole;
	deletedAt?: Date | undefined;
};

export class User {
	private constructor(private props: UserProps) {
		const regexNomeValido = /^[a-zA-Z0-9À-ÿ\s]+$/;
		if (this.props.name.length < 4) {
			throw new UnprocessableEntityError(
				"Nome do usuario deve ter no minimo 4 caracteres",
			);
		}

		if (!regexNomeValido.test(this.props.name)) {
			throw new UnprocessableEntityError(
				"O nome do usuário contém caracteres especiais inválidos",
			);
		}
	}

	static create(
		props: Omit<UserProps, "isDefaultPassword" | "deletedAt">,
	): User {
		props.name = props.name.trim();
		return new User(props);
	}

	static restore(props: UserProps): User {
		return new User(props);
	}

	update(props: Partial<Pick<UserProps, "name" | "email">>): void {
		if (props.name) {
			this.props.name = props.name;
		}

		if (props.email) {
			this.props.email = props.email;
		}
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

	get deletedAt(): Date | undefined {
		return this.props.deletedAt;
	}

	set passwordHasher(password) {
		this.props.passwordHashed = password;
	}
}
