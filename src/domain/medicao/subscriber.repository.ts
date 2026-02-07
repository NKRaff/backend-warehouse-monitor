export interface SubscriberTopic {
  dispositivoSubscribe(deviceId: string): Promise<void>
}
