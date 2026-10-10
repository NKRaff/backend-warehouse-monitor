import type { ITokenProvider } from "@application/ports/token-provider.interface.js";
import { UnauthorizedError } from "@shared/errors/unauthorized-error.js";
import type { NextFunction, Request, Response } from "express";

export function authMiddleware(tokenProvider: ITokenProvider) {
	return (req: Request, _res: Response, next: NextFunction) => {
		const token = req.cookies?.token;

		if (!token) {
			throw new UnauthorizedError("Token de acesso não encontrato");
		}

		const payload = tokenProvider.verify(token);

		req.user = {
			id: payload.sub,
			role: payload.role,
		};

		next();
	};
}
