import type { TokenPayload } from "@application/types/token-payload.js";

export interface ITokenProvider {
	sign(payload: TokenPayload): string;
	verify(token: string): TokenPayload;
}
