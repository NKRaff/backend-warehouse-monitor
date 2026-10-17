import type { IUserRepository } from "@application/repositories/user.interface.js";
import type { User } from "@domain/entities/user.js";
import type { UserRole } from "@domain/types/user-role.js";
import { userToDomain, userToPersistence } from "../mappers/user.mapper.js";
import { UserModel } from "../models/user.model.js";

export class UserRepository implements IUserRepository {
	private static _instance: UserRepository;

	private constructor() {}

	static instance(): UserRepository {
		if (!UserRepository._instance) {
			UserRepository._instance = new UserRepository();
		}
		return UserRepository._instance;
	}

	async save(user: User): Promise<void> {
		const model = userToPersistence(user);
		await UserModel.create(model);
	}

	async findById(id: string): Promise<User | null> {
		const userModel = await UserModel.findById(id);

		if (!userModel) {
			return null;
		}

		return userToDomain(userModel);
	}

	async findByEmail(email: string): Promise<User | null> {
		const userModel = await UserModel.findOne({ email });

		if (!userModel) {
			return null;
		}

		return userToDomain(userModel);
	}

	async findByRole(role: UserRole, active: boolean): Promise<User[]> {
		const usersModel = await UserModel.find({
			role,
			deletedAt: {
				$exists: !active,
			},
		});
		return usersModel.map((userModel) => {
			return userToDomain(userModel);
		});
	}

	async updatePassword(userId: string, password: string): Promise<void> {
		await UserModel.findByIdAndUpdate(userId, {
			password,
			isDefaultPassword: false,
		});
	}
}
