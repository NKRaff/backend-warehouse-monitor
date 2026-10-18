import { User } from "@domain/entities/user.js";
import { Email } from "@domain/object-values/email.js";
import type { UserRole } from "@domain/types/user-role.js";
import type { UserDocument } from "../models/user.model.js";

export function userToDomain(raw: UserDocument): User {
	const user = User.restore({
		id: raw._id,
		name: raw.name,
		email: new Email(raw.email),
		passwordHashed: raw.password,
		role: raw.role as UserRole,
		deletedAt: raw.deletedAt ?? undefined,
	});

	if (raw.emailVerified) {
		user.email.verify();
	}

	return user;
}

export function userToPersistence(
	user: User,
): Omit<UserDocument, "createdAt" | "updatedAt"> {
	return {
		_id: user.id,
		name: user.name,
		email: user.email.value,
		emailVerified: user.email.isVerified,
		password: user.passwordHasher,
		role: user.role,
		...(user.deletedAt && { deletedAt: user.deletedAt }),
	};
}
