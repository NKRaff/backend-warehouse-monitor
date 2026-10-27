import type { CreateDeviceOutputDto } from "@application/dtos/create-device.dto.js";
import type { ITokenProvider } from "@application/ports/token-provider.interface.js";
import type { AuthorizationPolicy } from "@application/services/authorization-policy.js";
import { Permission } from "@application/types/permission.js";
import type { IController } from "@presentation/controllers/controller.interface.js";
import { Router } from "express";
import { authorizationMiddleware } from "../middlewares/authorization-middleware.js";

export function createDeviceRoutes(
	tokenProvider: ITokenProvider,
	authorizationPolicy: AuthorizationPolicy,
	createDeviceController: IController<CreateDeviceOutputDto>,
): Router {
	const routes = Router();

	routes.post(
		"/create",
		authorizationMiddleware(
			tokenProvider,
			authorizationPolicy,
			Permission.MANAGE_DEVICE,
		),
		async (req, res, next) => {
			try {
				const actorId = req.user?.id;

				const result = await createDeviceController.handle(req.body, {
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
