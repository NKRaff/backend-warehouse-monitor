export interface WebsocketNotifier {
	sendToChat(userId: string, event: string, payload: unknown): void;
	broadcast(event: string, payload: unknown): void;
}
