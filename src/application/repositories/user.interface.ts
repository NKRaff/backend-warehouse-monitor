import type { User } from "@domain/entities/user.js";
import type { UserRole } from "@domain/types/user-role.js";

export interface IUserRepository {
	save(user: User): Promise<void>;
	findById(id: string): Promise<User | null>;
	findByEmail(email: string): Promise<User | null>;
	findByRole(role: UserRole): Promise<User[]>;
	updatePassword(userId: string, password: string): Promise<void>;
}
