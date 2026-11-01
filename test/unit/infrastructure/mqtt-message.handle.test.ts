import { MqttMessageHandle } from "@infrastructure/messaging/mqtt/handle/mqtt-message.handle.js";
import type { SaveMeasurementController } from "@presentation/controllers/save-measurement.controller.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetSingleton } from "../../helpers/singleton.js";

describe("MqttMessageHandle — RF-BE-021", () => {
	let listener: ((topic: string, payload: Buffer) => void | Promise<void>) | undefined;
	let registerGlobalListener: ReturnType<typeof vi.fn>;
	let handle: MqttMessageHandle;
	let saveMeasurement: { handle: ReturnType<typeof vi.fn> };

	beforeEach(() => {
		resetSingleton(MqttMessageHandle);
		listener = undefined;
		registerGlobalListener = vi.fn((callback) => {
			listener = callback;
		});
		saveMeasurement = { handle: vi.fn().mockResolvedValue(undefined) };
		handle = MqttMessageHandle.instance(
			{ registerGlobalListener } as never,
			saveMeasurement as unknown as SaveMeasurementController,
		);
		handle.register();
	});

	it("encaminha telemetria com o MAC do tópico e o payload original", async () => {
		const payload = Buffer.from('{"createdAt":"2026-03-01T08:00:00.000Z"}');

		await listener?.("device/AA:BB:CC:DD:EE:71/telemetry", payload);

		expect(registerGlobalListener).toHaveBeenCalledOnce();
		expect(saveMeasurement.handle).toHaveBeenCalledExactlyOnceWith(
			{ mac: "AA:BB:CC:DD:EE:71", payload },
			{},
		);
	});

	it.each(["device//telemetry", "device/AA:BB:CC:DD:EE:71", "device/AA:BB:CC:DD:EE:71/error"])(
		"ignora tópicos sem MAC ou que não sejam de telemetria (%s)",
		async (topic) => {
			await listener?.(topic, Buffer.from("{}"));

			expect(saveMeasurement.handle).not.toHaveBeenCalled();
		},
	);
});
