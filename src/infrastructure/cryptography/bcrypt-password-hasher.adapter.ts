import type { IPasswordHasher } from "@application/ports/password-hasher.interface.js";
import { compare, hash } from "bcrypt";
import { env } from "../config/env.js";

export class BcryptPasswordHasherAdapter implements IPasswordHasher {
	private static _instance: IPasswordHasher;

	private constructor() {}

	static instance(): IPasswordHasher {
		if (!BcryptPasswordHasherAdapter._instance) {
			BcryptPasswordHasherAdapter._instance = new BcryptPasswordHasherAdapter();
		}
		return BcryptPasswordHasherAdapter._instance;
	}

	async hash(value: string): Promise<string> {
		return await hash(value, env.security.bcryptRounds);
	}

	async compare(value: string, hash: string): Promise<boolean> {
		return await compare(value, hash);
	}
}
