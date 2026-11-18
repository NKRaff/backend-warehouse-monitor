import type { ListAllMeasurementOutputDto } from "@application/dtos/list-all-measurement.dto.js";
import type { ITokenProvider } from "@application/ports/token-provider.interface.js";
import type { AuthorizationPolicy } from "@application/services/authorization-policy.js";
import { Permission } from "@application/types/permission.js";
import type { IController } from "@presentation/controllers/controller.interface.js";
import { Router } from "express";
import { authorizationMiddleware } from "../middlewares/authorization-middleware.js";

export function createMeasurementRoutes(
	tokenProvider: ITokenProvider,
	authorizationPolicy: AuthorizationPolicy,
	listAllMeasurementController: IController<ListAllMeasurementOutputDto>,
): Router {
	const routes = Router();

	routes.post(
		"/findAll",
		authorizationMiddleware(
			tokenProvider,
			authorizationPolicy,
			Permission.LIST_MEASUREMENT,
		),
		async (req, res, next) => {
			try {
				const result = await listAllMeasurementController.handle(req.body, {});
				return res.status(200).json(result);
			} catch (error) {
				next(error);
			}
		},
	);

	return routes;
}
