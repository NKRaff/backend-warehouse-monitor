import type { Server, Socket } from "socket.io";

export interface WebsocketHandler {
	handle(socket: Socket, io: Server): void;
}
