import type { User } from "@domain/entities/user.js";

export interface IUserRepository {
	findByEmail(email: string): Promise<User | null>;
}
