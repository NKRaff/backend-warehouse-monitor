import type { User } from "@domain/entities/user.js";

export interface IUserRepository {
	findById(id: string): Promise<User | null>;
	findByEmail(email: string): Promise<User | null>;
}
