import { WarehouseHandle } from "@infrastructure/messaging/websocket/handle/warehouse.handle.js";
import { describe, expect, it, vi } from "vitest";

describe("WarehouseHandle — RF-BE-023", () => {
	it("permite entrar e sair da sala do armazém solicitado", () => {
		const callbacks = new Map<string, (warehouseId: string) => void>();
		const socket = {
			on: vi.fn((event: string, callback: (warehouseId: string) => void) => {
				callbacks.set(event, callback);
			}),
			join: vi.fn(),
			leave: vi.fn(),
		};
		const handler = new WarehouseHandle();

		handler.handle(socket as never, {} as never);
		callbacks.get("join-warehouse")?.("warehouse-1");
		callbacks.get("leave-warehouse")?.("warehouse-1");

		expect(socket.on).toHaveBeenCalledTimes(2);
		expect(socket.join).toHaveBeenCalledExactlyOnceWith("warehouse_warehouse-1");
		expect(socket.leave).toHaveBeenCalledExactlyOnceWith("warehouse_warehouse-1");
	});
});
