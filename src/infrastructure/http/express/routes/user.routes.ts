import type { ChangePasswordOutputDto } from "@application/dtos/change-password.dto.js";
import type { LoginOutputDto } from "@application/dtos/login.dto.js";
import type { RefreshTokenOutputDto } from "@application/dtos/refresh-token.dto.js";
import type { RegisterUserOutputDto } from "@application/dtos/register-user.dto.js";
import type { ITokenProvider } from "@application/ports/token-provider.interface.js";
import type { IUserRepository } from "@application/repositories/user.interface.js";
import type { AuthorizationPolicy } from "@application/services/authorization-policy.js";
import type { IController } from "@presentation/controllers/controller.interface.js";
import { UnauthorizedError } from "@shared/errors/unauthorized-error.js";
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
	refreshTokenController: IController<RefreshTokenOutputDto>,
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
				.cookie("refresh_token", result.refreshToken, {
					maxAge: 6 * 24 * 60 * 60 * 1000,
					httpOnly: env.cookie.httpOnly,
					secure: env.cookie.secure,
					sameSite: env.cookie.sameSite,
				})
				.json({ ...result, accessToken: undefined, refreshToken: undefined });
		} catch (error) {
			next(error);
		}
	});

	routes.patch(
		"/change-password:token",
		authorizationMiddleware(
			tokenProvider,
			authorizationPolicy,
			"change_password",
		),
		async (req, res, next) => {
			try {
				const token = req.params.token;
				const result = await changePasswordController.handle(
					{
						...req.body,
						resetToken: token,
					},
					{},
				);
				return res.status(200).json(result);
			} catch (error) {
				next(error);
			}
		},
	);

	routes.get("/refresh-token", async (req, res, next) => {
		try {
			const refreshToken = req.cookies?.refresh_token;
			if (!refreshToken) {
				throw new UnauthorizedError("Refresh token não encontrado nos cookies");
			}
			const result = await refreshTokenController.handle({ refreshToken }, {});

			return res
				.status(200)
				.cookie("access_token", result.accessToken, {
					maxAge: env.cookie.expiresIn,
					httpOnly: env.cookie.httpOnly,
					secure: env.cookie.secure,
					sameSite: env.cookie.sameSite,
				})
				.cookie("refresh_token", result.refreshToken, {
					maxAge: 6 * 24 * 60 * 60 * 1000,
					httpOnly: env.cookie.httpOnly,
					secure: env.cookie.secure,
					sameSite: env.cookie.sameSite,
				})
				.json(result.message);
		} catch (error) {
			next(error);
		}
	});

	return routes;
}
