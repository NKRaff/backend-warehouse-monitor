import type { ITokenRepository } from "@application/repositories/token.interface.js";
import type { Token } from "@domain/entities/token.js";
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

	async findByValue(tokenValueHash: string): Promise<Token | null> {
		const tokenModel = await TokenModel.findOne({ token: tokenValueHash });

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
}
