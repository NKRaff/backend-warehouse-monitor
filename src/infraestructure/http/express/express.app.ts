import cookieParser from "cookie-parser";
import express, { type Express, type Router } from "express";
import { env } from "../../config/env.js";
import { errorHandle } from "./middlewares/error-handle.js";

export class ExpressApp {
	private readonly app: Express;

	private constructor(routes: Router) {
		this.app = express();

		this.app.use(express.json());
		this.app.use(cookieParser(env.cookie.secret));
		this.app.use("api", routes);
		this.app.use(errorHandle);
	}

	static instance(routes: Router): Express {
		return new ExpressApp(routes).app;
	}
}
