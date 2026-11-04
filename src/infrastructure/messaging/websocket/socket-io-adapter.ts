import type { Server as HttpServer } from "node:http";
import type { WebsocketNotifier } from "@application/ports/websocket-notifier.interface.js";
import { type Socket, Server as SocketServer } from "socket.io";
import type { WebsocketHandler } from "./handle/websocket-handler.interface.js";

export class SocketIO implements WebsocketNotifier {
	private static _instance: SocketIO;
	private _io: SocketServer | null = null;

	private constructor() {}

	static instance(): SocketIO {
		if (!SocketIO._instance) {
			SocketIO._instance = new SocketIO();
		}
		return SocketIO._instance;
	}

	initialize(httpServer: HttpServer) {
		if (this.io) {
			throw new Error("Socket.IO já foi inicializado");
		}

		this._io = new SocketServer(httpServer, {
			cors: { origin: "*" },
		});
	}

	connect(handlers: WebsocketHandler[]) {
		this.io.on("connection", (socket: Socket) => {
			const userId =
				socket.handshake.auth.userId || socket.handshake.query.userId;

			if (userId) {
				socket.join(`user_${userId}`);
			}

			handlers.forEach((handler) => {
				handler.handle(socket, this.io);
			});

			socket.on("disconnect", () => {
				socket.disconnect();
			});
		});
	}

	sendToChat(userId: string, event: string, payload: unknown): void {
		this.io.to(`user_${userId}`).emit(event, payload);
	}

	broadcast(event: string, payload: unknown): void {
		this.io.emit(event, payload);
	}

	private get io(): SocketServer {
		if (!this._io) {
			throw new Error("Socket.IO ainda não foi inicializado");
		}

		return this._io;
	}
}
