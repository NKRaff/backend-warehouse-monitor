import type { Token } from "@domain/entities/token.js";

export interface ITokenRepository {
	save(token: Token): Promise<void>;
	findByValue(tokenValue: string): Promise<Token | null>;
	updateToken(id: string, value: string, expiresAt: Date): Promise<void>;
	deleteById(id: string): Promise<void>;
}
