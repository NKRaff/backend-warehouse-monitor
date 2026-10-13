import type { IUserRepository } from "@application/repositories/user.interface.js";
import { ForbiddenError } from "@shared/errors/forbidden-error.js";
import { NotFoundError } from "@shared/errors/not-found-error.js";
import { UnauthorizedError } from "@shared/errors/unauthorized-error.js";
import type { NextFunction, Request, Response } from "express";

export function requiredChangePasswordMiddleware(userRepo: IUserRepository) {
	return async (req: Request, _res: Response, next: NextFunction) => {
		const userId = req.user?.id;

		if (!userId) {
			throw new UnauthorizedError("Usuário não autenticado");
		}

		const user = await userRepo.findById(userId);

		if (user === null) {
			throw new NotFoundError(`Usuário não encontrado`);
		}

		if (user.isDefaultPassword) {
			throw new ForbiddenError(
				`Você precisa alterar sua senha antes de continuar`,
			);
		}

		next();
	};
}
