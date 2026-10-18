import { createHash } from "node:crypto";
import type { ITokenRepository } from "@application/repositories/token.interface.js";
import type { Token } from "@domain/entities/token.js";
import type { TokenType } from "@domain/types/token-type.js";
import { tokenToDomain, tokenToPersistence } from "../mappers/token.mapper.js";
import { TokenModel } from "../models/token.model.js";

export class TokenRepository implements ITokenRepository {
	private static _instance: TokenRepository;

	private constructor() {}

	static instance(): TokenRepository {
		if (!TokenRepository._instance) {
			TokenRepository._instance = new TokenRepository();
		}
		return TokenRepository._instance;
	}

	async save(token: Token): Promise<void> {
		const model = tokenToPersistence(token);
		await TokenModel.create(model);
	}

	async findByValue(tokenValue: string): Promise<Token | null> {
		const valueHash = createHash("sha256").update(tokenValue).digest("hex");
		const tokenModel = await TokenModel.findOne({ valueHash });

		if (tokenModel === null) {
			return null;
		}

		return tokenToDomain(tokenModel);
	}

	async findByUserAndType(
		userId: string,
		type: TokenType,
	): Promise<Token | null> {
		const tokenModel = await TokenModel.findOne({ userId, type });

		if (tokenModel === null) {
			return null;
		}

		return tokenToDomain(tokenModel);
	}

	async updateToken(id: string, value: string, expiresAt: Date): Promise<void> {
		await TokenModel.findByIdAndUpdate(id, {
			valueHash: value,
			expiresAt,
		});
	}

	async deleteById(id: string): Promise<void> {
		await TokenModel.findByIdAndDelete(id);
	}

	async deleteAllByUser(userId: string): Promise<void> {
		await TokenModel.deleteMany({ userId });
	}
}
