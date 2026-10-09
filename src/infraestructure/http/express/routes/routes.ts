import { Router } from "express";

export class Routes {
	private routes: Router;

	private constructor() {
		this.routes = Router();
	}

	static instance(): Router {
		return new Routes().routes;
	}
}
