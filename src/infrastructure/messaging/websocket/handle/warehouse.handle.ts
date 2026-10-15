import type { Server, Socket } from "socket.io";
import type { WebsocketHandler } from "./websocket-handler.interface.js";

export class WarehouseHandle implements WebsocketHandler {
	handle(socket: Socket, _io: Server): void {
		socket.on("join-warehouse", (warehouseId: string) => {
			socket.join(`warehouse_${warehouseId}`);
		});

		socket.on("leave-warehouse", (warehouseId: string) => {
			socket.leave(`warehouse_${warehouseId}`);
		});
	}
}
