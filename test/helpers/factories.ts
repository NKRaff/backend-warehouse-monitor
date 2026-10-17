import type { NotificationMessage } from "@application/types/notification-message.js";
import { User } from "@domain/entities/user.js";
import { Email } from "@domain/object-values/email.js";
import type { UserRole } from "@domain/types/user-role.js";

type UserOverrides = Partial<{
	id: string;
	name: string;
	email: string;
	passwordHashed: string;
	role: UserRole;
	deletedAt: Date;
	verified: boolean;
}>;

/** Usuário já "restaurado" (sem senha padrão), pronto para uso em testes. */
export function makeUser(overrides: UserOverrides = {}): User {
	const email = new Email(overrides.email ?? "maria@empresa.com");
	if (overrides.verified) {
		email.verify();
	}

	return User.restore({
		id: overrides.id ?? "user-1",
		name: overrides.name ?? "Maria Silva",
		email,
		passwordHashed: overrides.passwordHashed ?? "hashed:Senha@123",
		role: overrides.role ?? "administrator",
		deletedAt: overrides.deletedAt,
	});
}

export function makeNotificationMessage(
	overrides: Partial<NotificationMessage> = {},
): NotificationMessage {
	return {
		recipient: makeUser(),
		title: "Título da notificação",
		message: "Mensagem da notificação",
		type: "measurement_out_of_limits",
		severity: "warning",
		status: "active",
		channels: ["email"],
		...overrides,
	};
}
