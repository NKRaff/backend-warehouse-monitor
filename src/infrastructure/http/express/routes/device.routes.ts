import type { CreateDeviceOutputDto } from "@application/dtos/create-device.dto.js";
import type { DeleteDeviceOutputDto } from "@application/dtos/delete-device.dto.js";
import type { GetDeviceOutputDto } from "@application/dtos/get-device.dto.js";
import type { UpdateDeviceOutputDto } from "@application/dtos/update-device.dto.js";
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
	updateDeviceController: IController<UpdateDeviceOutputDto>,
	deleteDeviceController: IController<DeleteDeviceOutputDto>,
	getDeviceController: IController<GetDeviceOutputDto>,
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

	routes.patch(
		"/update",
		authorizationMiddleware(
			tokenProvider,
			authorizationPolicy,
			Permission.MANAGE_DEVICE,
		),
		async (req, res, next) => {
			try {
				const actorId = req.user?.id;

				const result = await updateDeviceController.handle(req.body, {
					actorId,
				});

				return res.status(200).json(result);
			} catch (error) {
				next(error);
			}
		},
	);

	routes.delete(
		"/delete",
		authorizationMiddleware(
			tokenProvider,
			authorizationPolicy,
			Permission.MANAGE_WAREHOUSE,
		),
		async (req, res, next) => {
			try {
				const actorId = req.user?.id;

				const result = await deleteDeviceController.handle(req.body, {
					actorId,
				});

				return res.status(200).json(result);
			} catch (error) {
				next(error);
			}
		},
	);

	routes.get(
		"/:mac",
		authorizationMiddleware(
			tokenProvider,
			authorizationPolicy,
			Permission.LIST_DEVICE,
		),
		async (req, res, next) => {
			try {
				const result = getDeviceController.handle(req.params, {});
				return res.status(200).json(result);
			} catch (error) {
				next(error);
			}
		},
	);

	return routes;
}
