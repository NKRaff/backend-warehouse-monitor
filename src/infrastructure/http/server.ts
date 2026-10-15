import { createServer, type Server } from "node:http";
import type { Express } from "express";
import { env } from "../config/env.js";

export class HttpServer {
	private static _instance: HttpServer;
	private _server: Server;

	private constructor(app: Express) {
		this._server = createServer(app);
	}

	static instance(app: Express): HttpServer {
		if (!HttpServer._instance) {
			HttpServer._instance = new HttpServer(app);
		}
		return HttpServer._instance;
	}

	server(): Server {
		return this._server;
	}

	connect(): void {
		this._server.listen(env.app.port, env.app.host, () => {
			console.log(`🖥️ Http server is running in port ${env.app.port}`);
		});
	}

	desconnect(): void {
		this._server.close();
	}
}
