import type { IUserRepository } from "@application/repositories/user.interface.js";
import type { User } from "@domain/entities/user.js";
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

	async findByEmail(email: string): Promise<User | null> {
		return await UserModel.findOne({ email });
	}
}
