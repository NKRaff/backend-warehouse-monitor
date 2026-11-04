import { SocketIO } from "@infrastructure/messaging/websocket/socket-io-adapter.js";
import type { WebsocketHandler } from "@infrastructure/messaging/websocket/handle/websocket-handler.interface.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetSingleton } from "../../../../helpers/singleton.js";

const socketIoState = vi.hoisted(() => ({
	instances: [] as Array<{
		on: ReturnType<typeof vi.fn>;
		emit: ReturnType<typeof vi.fn>;
		to: ReturnType<typeof vi.fn>;
		roomEmit: ReturnType<typeof vi.fn>;
	}>,
	constructorArgs: [] as unknown[][],
}));

vi.mock("socket.io", () => ({
	Server: class {
		on = vi.fn();
		emit = vi.fn();
		roomEmit = vi.fn();
		to = vi.fn(() => ({ emit: this.roomEmit }));

		constructor(...args: unknown[]) {
			socketIoState.instances.push(this);
			socketIoState.constructorArgs.push(args);
		}
	},
}));

describe("SocketIO — RF-BE-023", () => {
	it.todo("rejeita handshakes sem token válido ou com token expirado");
	it.todo("envia telemetria somente ao canal do armazém correspondente");

	let socketIo: SocketIO;

	beforeEach(() => {
		resetSingleton(SocketIO);
		socketIoState.instances.length = 0;
		socketIoState.constructorArgs.length = 0;
		socketIo = SocketIO.instance();
	});

	it("exige inicialização antes de conectar ou emitir", () => {
		expect(() => socketIo.connect([])).toThrow("Socket.IO ainda não foi inicializado");
		expect(() => socketIo.broadcast("evento", {})).toThrow(
			"Socket.IO ainda não foi inicializado",
		);
		expect(() => socketIo.sendToChat("user-1", "evento", {})).toThrow(
			"Socket.IO ainda não foi inicializado",
		);
	});

	it("inicializa uma vez com CORS aberto", () => {
		const server = {} as never;

		expect(() => socketIo.initialize(server)).not.toThrow();
		expect(socketIoState.constructorArgs).toEqual([
			[server, { cors: { origin: "*" } }],
		]);
		expect(() => socketIo.initialize(server)).toThrow(
			"Socket.IO já foi inicializado",
		);
	});

	it("associa usuário e handlers na conexão e encerra o socket ao desconectar", () => {
		socketIo.initialize({} as never);
		const server = socketIoState.instances[0]!;
		let onConnection: ((socket: never) => void) | undefined;
		server.on.mockImplementation((event, callback) => {
			if (event === "connection") onConnection = callback;
		});
		const handler: WebsocketHandler = { handle: vi.fn() };
		socketIo.connect([handler]);
		const callbacks = new Map<string, () => void>();
		const socket = {
			handshake: { auth: { userId: "user-auth" }, query: { userId: "user-query" } },
			join: vi.fn(),
			on: vi.fn((event: string, callback: () => void) => callbacks.set(event, callback)),
			disconnect: vi.fn(),
		} as never;

		onConnection?.(socket);
		callbacks.get("disconnect")?.();

		expect((socket as { join: ReturnType<typeof vi.fn> }).join).toHaveBeenCalledExactlyOnceWith(
			"user_user-auth",
		);
		expect(handler.handle).toHaveBeenCalledOnce();
		expect((socket as { disconnect: ReturnType<typeof vi.fn> }).disconnect).toHaveBeenCalledOnce();
	});

	it("emite para uma sala privada e transmite para todos os sockets", () => {
		socketIo.initialize({} as never);
		const server = socketIoState.instances[0]!;
		const payload = { measurement: 22 };

		socketIo.sendToChat("user-1", "message.created", payload);
		socketIo.broadcast("telemetry.updated", payload);

		expect(server.to).toHaveBeenCalledExactlyOnceWith("user_user-1");
		expect(server.roomEmit).toHaveBeenCalledExactlyOnceWith("message.created", payload);
		expect(server.emit).toHaveBeenCalledExactlyOnceWith("telemetry.updated", payload);
	});
});
