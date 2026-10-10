import type { IUserRepository } from "@application/repositories/user.interface.js";
import type { User } from "@domain/entities/user.js";
import { userToDomain } from "../mappers/user.mapper.js";
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
}
