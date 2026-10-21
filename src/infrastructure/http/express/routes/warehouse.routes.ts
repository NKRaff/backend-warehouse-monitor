import type { CreateWarehouseOutputDto } from "@application/dtos/create-warehouse.dto.js";
import type { DeleteWarehouseOutputDto } from "@application/dtos/delete-warehouse.dto.js";
import type { GetWarehouseOutputDto } from "@application/dtos/get-warehouse.dto.js";
import type { ListAllWarehouseOutputDto } from "@application/dtos/list-all-warehouse.dto.js";
import type { UpdateWarehouseOutputDto } from "@application/dtos/update-warehouse.js";
import type { ITokenProvider } from "@application/ports/token-provider.interface.js";
import type { AuthorizationPolicy } from "@application/services/authorization-policy.js";
import { Permission } from "@application/types/permission.js";
import type { IController } from "@presentation/controllers/controller.interface.js";
import { Router } from "express";
import { authorizationMiddleware } from "../middlewares/authorization-middleware.js";

export function createWarehouseRoutes(
	tokenProvider: ITokenProvider,
	authorizationPolicy: AuthorizationPolicy,
	createWarehouseController: IController<CreateWarehouseOutputDto>,
	deleteWarehouseController: IController<DeleteWarehouseOutputDto>,
	updateWarehouseController: IController<UpdateWarehouseOutputDto>,
	getWarehouseController: IController<GetWarehouseOutputDto>,
	listAllWarehouseController: IController<ListAllWarehouseOutputDto>,
): Router {
	const routes = Router();

	routes.post(
		"/create",
		authorizationMiddleware(
			tokenProvider,
			authorizationPolicy,
			Permission.MANAGE_WAREHOUSE,
		),
		async (req, res, next) => {
			try {
				const result = await createWarehouseController.handle(req.body, {
					...(req.user && { actorId: req.user.id }),
				});

				return res.status(201).json(result);
			} catch (error) {
				next(error);
			}
		},
	);

	routes.delete(
		"/delete-warehouse",
		authorizationMiddleware(
			tokenProvider,
			authorizationPolicy,
			Permission.MANAGE_WAREHOUSE,
		),
		async (req, res, next) => {
			try {
				const result = await deleteWarehouseController.handle(req.body, {
					...(req.user && { actorId: req.user.id }),
				});

				return res.status(200).json(result);
			} catch (error) {
				next(error);
			}
		},
	);

	routes.patch(
		"/update-warehouse",
		authorizationMiddleware(
			tokenProvider,
			authorizationPolicy,
			Permission.MANAGE_WAREHOUSE,
		),
		async (req, res, next) => {
			try {
				const result = await updateWarehouseController.handle(req.body, {
					actorId: req.user?.id,
				});

				return res.status(200).json(result);
			} catch (error) {
				next(error);
			}
		},
	);

	routes.get(
		"/warehouses/",
		authorizationMiddleware(
			tokenProvider,
			authorizationPolicy,
			Permission.LIST_WAREHOUSE,
		),
		async (req, res, next) => {
			try {
				const result = await listAllWarehouseController.handle(req.query, {});
				return res.status(200).json(result);
			} catch (error) {
				next(error);
			}
		},
	);

	routes.get(
		"/:warehouseId",
		authorizationMiddleware(
			tokenProvider,
			authorizationPolicy,
			Permission.LIST_WAREHOUSE,
		),
		async (req, res, next) => {
			try {
				const result = await getWarehouseController.handle(req.params, {});
				return res.status(200).json(result);
			} catch (error) {
				next(error);
			}
		},
	);

	return routes;
}
