import type { ChangePasswordOutputDto } from "@application/dtos/change-password.dto.js";
import type { LoginOutputDto } from "@application/dtos/login.dto.js";
import type { RegisterUserOutputDto } from "@application/dtos/register-user.dto.js";
import type { ITokenProvider } from "@application/ports/token-provider.interface.js";
import type { IUserRepository } from "@application/repositories/user.interface.js";
import type { AuthorizationPolicy } from "@application/services/authorization-policy.js";
import type { IController } from "@presentation/controllers/controller.interface.js";
import { Router } from "express";
import { env } from "../../../config/env.js";
import { authorizationMiddleware } from "../middlewares/authorization-middleware.js";
import { requiredChangePasswordMiddleware } from "../middlewares/required-change-password.middleware.js";

export function createUserRoutes(
	tokenProvider: ITokenProvider,
	authorizationPolicy: AuthorizationPolicy,
	registerUserController: IController<RegisterUserOutputDto>,
	loginController: IController<LoginOutputDto>,
	changePasswordController: IController<ChangePasswordOutputDto>,
	userRepo: IUserRepository,
): Router {
	const routes = Router();

	routes.post(
		"/register",
		authorizationMiddleware(
			tokenProvider,
			authorizationPolicy,
			"register_user",
		),
		requiredChangePasswordMiddleware(userRepo),
		async (req, res, next) => {
			try {
				const actorId = req.user?.id;

				const result = await registerUserController.handle(req.body, {
					actorId,
				});

				return res.status(201).json(result);
			} catch (error) {
				next(error);
			}
		},
	);

	routes.post("/login", async (req, res, next) => {
		try {
			const result = await loginController.handle(req.body, {
				actorId: undefined,
			});

			return res
				.status(200)
				.cookie("access_token", result.accessToken, {
					maxAge: env.cookie.expiresIn,
					httpOnly: env.cookie.httpOnly,
					secure: env.cookie.secure,
					sameSite: env.cookie.sameSite,
				})
				.json({ ...result, accessToken: undefined });
		} catch (error) {
			next(error);
		}
	});

	routes.patch(
		"/change-password",
		authorizationMiddleware(
			tokenProvider,
			authorizationPolicy,
			"register_user",
		),
		async (req, res, next) => {
			try {
				const actorId = req.user?.id;
				const result = await changePasswordController.handle(req.body, {
					actorId,
				});
				return res.status(200).json(result);
			} catch (error) {
				next(error);
			}
		},
	);

	return routes;
}
