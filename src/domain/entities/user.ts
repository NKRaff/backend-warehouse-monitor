import type { Email } from "@domain/object-values/email.js";
import type { UserRole } from "@domain/types/user-role.js";
import { UnprocessableEntityError } from "@shared/errors/unprocessable-entity-error.js";

type UserProps = {
	readonly id: string;
	name: string;
	email: Email;
	passwordHashed: string;
	role: UserRole;
	readonly createdAt: Date;
	updatedAt: Date;
	deletedAt?: Date;
};

export class User {
	private constructor(private props: UserProps) {
		if (this.props.name.length < 4) {
			throw new UnprocessableEntityError(
				"Nome do usuario deve ter no minimo 4 caracteres",
			);
		}
	}

	static create(
		props: Omit<UserProps, "createdAt" | "updatedAt" | "deletedAt">,
	): User {
		props.name = props.name.trim();
		const now = new Date();

		return new User({
			...props,
			createdAt: now,
			updatedAt: now,
		});
	}

	static restore(props: UserProps): User {
		return new User(props);
	}
}
