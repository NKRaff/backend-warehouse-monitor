import type { UserRole } from "@domain/types/user-role.js";
import { BcryptPasswordHasherAdapter } from "@infrastructure/cryptography/bcrypt-password-hasher.adapter.js";
import { userToPersistence } from "@infrastructure/database/mongodb/mappers/user.mapper.js";
import { UserModel } from "@infrastructure/database/mongodb/models/user.model.js";
import { makeUser } from "./factories.js";

type SeedUserOptions = Partial<{
	id: string;
	name: string;
	email: string;
	password: string;
	role: UserRole;
	isDefaultPassword: boolean;
	deletedAt: Date;
}>;

let sequence = 0;

/**
 * Insere direto no MongoDB um usuário com senha real (bcrypt). Útil porque a
 * rota de cadastro exige um administrador autenticado: o "primeiro" admin dos
 * testes nasce por aqui.
 */
export async function seedUser(options: SeedUserOptions = {}) {
	const n = ++sequence;
	const password = options.password ?? "Senha@123";
	const passwordHasher = BcryptPasswordHasherAdapter.instance();

	const user = makeUser({
		id: options.id ?? `seed-user-${n}`,
		name: options.name ?? `Usuário Teste ${n}`,
		email: options.email ?? `usuario${n}@empresa.com`,
		role: options.role ?? "administrator",
		passwordHashed: await passwordHasher.hash(password),
		...(options.deletedAt && { deletedAt: options.deletedAt }),
	});

	await UserModel.create({
		...userToPersistence(user),
		isDefaultPassword: options.isDefaultPassword ?? false,
	});

	return { user, password };
}
