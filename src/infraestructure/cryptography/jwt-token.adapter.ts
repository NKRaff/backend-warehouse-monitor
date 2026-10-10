import type { ITokenProvider } from "@application/ports/token-provider.interface.js";
import type { TokenPayload } from "@application/types/token-payload.js";
import { UnauthorizedError } from "@shared/errors/unauthorized-error.js";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export class JwtTokenAdapter implements ITokenProvider {
	private static _instance: ITokenProvider;

	private constructor() {}

	static instance(): ITokenProvider {
		if (!JwtTokenAdapter._instance) {
			JwtTokenAdapter._instance = new JwtTokenAdapter();
		}
		return JwtTokenAdapter._instance;
	}

	sign(payload: TokenPayload): string {
		return jwt.sign(payload, env.jwt.secret, {
			expiresIn: `${env.jwt.expiresInMs}`,
		});
	}

	verify(token: string): TokenPayload {
		try {
			return jwt.verify(token, env.jwt.secret) as TokenPayload;
		} catch (error: any) {
			if (error.name === "TokenExpiredError") {
				throw new UnauthorizedError("Token de acesso expirado");
			}

			if (error.name === "NotBeforeError") {
				throw new UnauthorizedError("Token de acesso ainda não está ativo");
			}

			throw new UnauthorizedError("Token de acesso inválido");
		}
	}
}
