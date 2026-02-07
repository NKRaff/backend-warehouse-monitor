import type { SubscriberTopic } from '@/domain/medicao/subscriber.repository.js'
import type { ClientMQTT } from './client.js'

export class MqttTopicSubscriber implements SubscriberTopic {
  private constructor(private readonly mqtt: ClientMQTT) {}

  public static create(mqtt: ClientMQTT) {
    return new MqttTopicSubscriber(mqtt)
  }

  async dispositivoSubscribe(deviceId: string) {
    this.mqtt.subscribe(`${deviceId}/+`)
  }
}
