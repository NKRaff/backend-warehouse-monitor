import type { ITokenProvider } from "@application/ports/token-provider.interface.js";
import type { AuthorizationPolicy } from "@application/services/authorization-policy.js";
import type { Permission } from "@application/types/permission.js";
import { UnauthorizedError } from "@shared/errors/unauthorized-error.js";
import type { NextFunction, Request, Response } from "express";

export function authorizationMiddleware(
	tokenProvider: ITokenProvider,
	authorizationPolicy: AuthorizationPolicy,
	permission: Permission,
) {
	return async (req: Request, _res: Response, next: NextFunction) => {
		const token = req.cookies?.token;

		if (!token) {
			throw new UnauthorizedError("Token de acesso não encontrato");
		}

		const payload = tokenProvider.verify(token);

		await authorizationPolicy.hasPermission(payload.sub, permission);

		req.user = {
			id: payload.sub,
		};

		next();
	};
}
