import type { IMqttClient } from "@application/ports/mqtt-client.interface.js";
import type { MqttCallback } from "@application/types/mqtt-callback.js";
import { ServiceUnavailableError } from "@shared/errors/service-unavailable-error.js";
import type { MqttClient } from "mqtt";
import mqtt from "mqtt";
import { env } from "../../config/env.js";

export class MqttAdapter implements IMqttClient {
	private static _instance: MqttAdapter;
	private client: MqttClient | null = null;
	private messageCallbacks = new Map<string, MqttCallback[]>();

	private constructor() {}

	static instance() {
		if (!MqttAdapter._instance) {
			MqttAdapter._instance = new MqttAdapter();
		}
		return MqttAdapter._instance;
	}

	async connect(): Promise<void> {
		return new Promise((resolve, reject) => {
			if (this.client && this.client.connected) {
				return resolve();
			}

			this.client = mqtt.connect(env.mqtt.URL, {
				username: env.mqtt.username,
				password: env.mqtt.password,
				reconnectPeriod: 1000,
			});

			this.client.on("connect", () => {
				console.log("📡 Cliente MQTT conectado");
				this.client?.removeAllListeners("error");

				this.client?.on("error", (err) => {
					console.error("⚠️ Erro na conexão MQTT:", err.message);
				});

				resolve();
			});

			this.client.on("message", (incomingTopic, payload) => {
				const callbacks = this.messageCallbacks.get(incomingTopic);
				if (callbacks) {
					callbacks.forEach((callback) => {
						callback(incomingTopic, payload);
					});
				}
			});

			this.client.on("error", (error) => {
				reject(
					new ServiceUnavailableError(
						`Não foi possível conectar ao broker MQTT: ${error.message}`,
						{ cause: error },
					),
				);
			});
		});
	}

	async disconnect(): Promise<void> {
		return new Promise((resolve) => {
			if (!this.client) {
				return resolve();
			}

			this.client.end(false, {}, () => {
				this.client = null;
				console.log("📡 Cliente MQTT desconectado");
				resolve();
			});
		});
	}

	async publish(topic: string, message: string): Promise<void> {
		return new Promise((resolve, reject) => {
			if (!this.client || !this.client.connected) {
				return reject(
					new ServiceUnavailableError(
						"Cliente MQTT não está conectado ao broker",
					),
				);
			}

			this.client.publish(topic, message, (error) => {
				if (error) {
					return reject(
						new ServiceUnavailableError(
							`Erro ao publicar mensagem no tópico ${topic}: ${error.message}`,
							{ cause: error },
						),
					);
				}
				resolve();
			});
		});
	}

	public async subscribe(topic: string, callback: MqttCallback): Promise<void> {
		return new Promise((resolve, reject) => {
			if (!this.client || !this.client.connected) {
				return reject(
					new ServiceUnavailableError(
						"Cliente MQTT não está conectado ao broker",
					),
				);
			}

			if (!this.messageCallbacks.has(topic)) {
				this.messageCallbacks.set(topic, []);
			}
			this.messageCallbacks.get(topic)?.push(callback);

			this.client.subscribe(topic, (error) => {
				if (error) {
					return reject(
						new ServiceUnavailableError(
							`Erro ao se inscrever no tópico ${topic}: ${error.message}`,
							{ cause: error },
						),
					);
				}
				resolve();
			});
		});
	}
}
