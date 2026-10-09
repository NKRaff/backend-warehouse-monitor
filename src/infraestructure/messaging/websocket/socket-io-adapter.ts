import type { Server as HttpServer } from "node:http";
import type { WebsocketNotifier } from "@application/ports/websocket-notifier.interface.js";
import { type Socket, Server as SocketServer } from "socket.io";
import type { WebsocketHandler } from "./handle/websocket-handler.interface.js";

export class SocketIO implements WebsocketNotifier {
	private static _instance: SocketIO;
	private io: SocketServer;

	private constructor(httpServer: HttpServer) {
		this.io = new SocketServer(httpServer, {
			cors: { origin: "*" },
		});
	}

	static instance(httpServer: HttpServer): SocketIO {
		if (!SocketIO._instance) {
			SocketIO._instance = new SocketIO(httpServer);
		}
		return SocketIO._instance;
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
}
