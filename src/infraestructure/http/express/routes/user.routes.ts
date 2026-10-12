import type { RegisterUserOutputDto } from "@application/dtos/register-user.dto.js";
import type { IController } from "@presentation/controllers/controller.interface.js";
import { UnauthorizedError } from "@shared/errors/unauthorized-error.js";
import { Router } from "express";

export function createUserRoutes(
	registerUserController: IController<RegisterUserOutputDto>,
): Router {
	const routes = Router();

	routes.post("/register", async (req, res, next) => {
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
	});

	return routes;
}
