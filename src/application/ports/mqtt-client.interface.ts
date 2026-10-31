export interface IMqttClient {
	publish(topic: string, message: string): Promise<void>;
	subscribe(topic: string): Promise<void>;
	unsubscribe(topic: string): Promise<void>;
}
