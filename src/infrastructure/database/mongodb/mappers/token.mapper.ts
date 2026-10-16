import { Token } from "@domain/entities/token.js";
import type { TokenType } from "@domain/types/token-type.js";
import type { TokenDocument } from "../models/token.model.js";

export function tokenToDomain(raw: TokenDocument): Token {
	return Token.restore({
		id: raw._id,
		userId: raw.userId,
		type: raw.type as TokenType,
		value: raw.valueHash,
		expiresAt: raw.expiresAt,
	});
}

export function tokenToPersistence(
	token: Token,
): Omit<TokenDocument, "createdAt" | "updatedAt"> {
	return {
		_id: token.id,
		userId: token.userId,
		type: token.type,
		valueHash: token.value,
		expiresAt: token.expiresAt,
	};
}
