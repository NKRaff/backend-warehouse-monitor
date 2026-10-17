import type { User } from "@domain/entities/user.js";
import type { UserRole } from "@domain/types/user-role.js";

export interface IUserRepository {
	save(user: User): Promise<void>;
	findById(id: string): Promise<User | null>;
	findByEmail(email: string): Promise<User | null>;
	findByRole(role: UserRole, active: boolean): Promise<User[]>;
	updateUser(user: User): Promise<void>;
	updateRole(id: string, role: UserRole): Promise<void>;
	updatePassword(userId: string, password: string): Promise<void>;
	deleteById(id: string): Promise<void>;
}
