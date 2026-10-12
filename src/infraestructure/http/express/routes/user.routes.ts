import type { RegisterUserOutputDto } from "@application/dtos/register-user.dto.js";
import type { ITokenProvider } from "@application/ports/token-provider.interface.js";
import type { AuthorizationPolicy } from "@application/services/authorization-policy.js";
import type { IController } from "@presentation/controllers/controller.interface.js";
import { UnauthorizedError } from "@shared/errors/unauthorized-error.js";
import { Router } from "express";
import { authorizationMiddleware } from "../middlewares/authorization-middleware.js";

export function createUserRoutes(
	tokenProvider: ITokenProvider,
	authorizationPolicy: AuthorizationPolicy,
	registerUserController: IController<RegisterUserOutputDto>,
): Router {
	const routes = Router();

	routes.post(
		"/register",
		authorizationMiddleware(
			tokenProvider,
			authorizationPolicy,
			"register_user",
		),
		async (req, res, next) => {
			try {
				const actorId = req.user?.id;

				if (!actorId) {
					throw new UnauthorizedError("Id do usuario não encontrado");
				}

				const result = await registerUserController.handle(req.body, {
					actorId,
				});

				return res.status(201).json(result);
			} catch (error) {
				next(error);
			}
		},
	);

	return routes;
}
