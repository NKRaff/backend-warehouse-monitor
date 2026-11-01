import type { SaveMeasurementController } from "@presentation/controllers/save-measurement.controller.js";
import type { MqttAdapter } from "../mqtt.adapter.js";

export class MqttMessageHandle {
	private static _instance: MqttMessageHandle;

	private constructor(
		private readonly mqttClient: MqttAdapter,
		private readonly saveMeasurement: SaveMeasurementController,
	) {}

	static instance(
		mqttClient: MqttAdapter,
		saveMeasurement: SaveMeasurementController,
	): MqttMessageHandle {
		if (!MqttMessageHandle._instance) {
			MqttMessageHandle._instance = new MqttMessageHandle(
				mqttClient,
				saveMeasurement,
			);
		}
		return MqttMessageHandle._instance;
	}

	register(): void {
		this.mqttClient.registerGlobalListener(async (topic, payload) => {
			await this.handleMessage(topic, payload);
		});
	}

	private async handleMessage(topic: string, payload: Buffer): Promise<void> {
		const [, mac, event] = topic.split("/");

		if (!mac || !event) {
			return;
		}

		switch (event) {
			case "telemetry":
				await this.saveMeasurement.handle({ mac, payload }, {});
				break;
		}
	}
}
