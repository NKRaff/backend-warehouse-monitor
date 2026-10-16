import type { Token } from "@domain/entities/token.js";

export interface ITokenRepository {
	save(token: Token): Promise<void>;
	findByValue(tokenValue: string): Promise<Token | null>;
}
