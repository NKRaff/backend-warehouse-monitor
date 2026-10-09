import type { MqttCallback } from "@application/types/mqtt-callback.js";

export interface IMqttClient {
	publish(topic: string, message: string): Promise<void>;
	subscribe(topic: string, callback: MqttCallback): Promise<void>;
}
