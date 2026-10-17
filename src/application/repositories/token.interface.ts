import type { Token } from "@domain/entities/token.js";
import type { TokenType } from "@domain/types/token-type.js";

export interface ITokenRepository {
	save(token: Token): Promise<void>;
	findByValue(tokenValue: string): Promise<Token | null>;
	findByUserAndType(userId: string, type: TokenType): Promise<Token | null>;
	updateToken(id: string, value: string, expiresAt: Date): Promise<void>;
	deleteById(id: string): Promise<void>;
}
