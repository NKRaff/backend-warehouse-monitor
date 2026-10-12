import type { LoginOutputDto } from "@application/dtos/login.dto.js";
import type { RegisterUserOutputDto } from "@application/dtos/register-user.dto.js";
import type { ITokenProvider } from "@application/ports/token-provider.interface.js";
import type { AuthorizationPolicy } from "@application/services/authorization-policy.js";
import type { IController } from "@presentation/controllers/controller.interface.js";
import { UnauthorizedError } from "@shared/errors/unauthorized-error.js";
import { Router } from "express";
import { env } from "../../../config/env.js";
import { authorizationMiddleware } from "../middlewares/authorization-middleware.js";

export function createUserRoutes(
	tokenProvider: ITokenProvider,
	authorizationPolicy: AuthorizationPolicy,
	registerUserController: IController<RegisterUserOutputDto>,
	loginController: IController<LoginOutputDto>,
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

	routes.post(
		"/login",
		authorizationMiddleware(tokenProvider, authorizationPolicy, "login"),
		async (req, res, next) => {
			try {
				const actorId = req.user?.id;

				if (!actorId) {
					throw new UnauthorizedError("Id do usuario não encontrado");
				}

				const result = await loginController.handle(req.body, { actorId });

				return res
					.status(200)
					.cookie("access_token", result.accessToken, {
						maxAge: env.cookie.expiresIn,
						httpOnly: env.cookie.httpOnly,
						secure: env.cookie.secure,
						sameSite: env.cookie.sameSite,
					})
					.json(result);
			} catch (error) {
				next(error);
			}
		},
	);

	return routes;
}
