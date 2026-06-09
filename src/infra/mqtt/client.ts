import mqtt, { type MqttClient } from 'mqtt'

export type clientOptions = {
  username: string
  password: string
}

export type MqttMessage = {
  topic: string
  payload: Buffer
}

export type MqttMessageListener = (message: MqttMessage) => void

export class ClientMQTT {
  private clientMQTT: MqttClient
  private listeners: MqttMessageListener[] = []

  private constructor(options: clientOptions) {
    this.clientMQTT = mqtt.connect(process.env.BROKER_URL || 'mqtt://test.mosquitto.org', options)
    this.clientMQTT.on('message', (topic, payload) => {
      this.listeners.forEach((l) => {
        l({ topic, payload })
      })
    })
    this.clientMQTT.on('error', (error) => {
      console.log('Erro ao se conectar ao Broker MQTT: ', error)
      this.clientMQTT.end()
    })

    this.clientMQTT.on('reconnect', () => {
      console.log('Reconectando ao Broker MQTT...')
    })

    this.clientMQTT.on('connect', () => {
      console.log('📡 Cliente MQTT conectado')
    })
  }

  public static create() {
    const options: clientOptions = {
      username: process.env.BROKER_CLIENT_USERNAME || '',
      password: process.env.BROKER_CLIENT_PASSWORD || '',
    }
    return new ClientMQTT(options)
  }

  public disconnect() {
    this.clientMQTT.end()
  }

  onMessage(listener: MqttMessageListener) {
    this.listeners.push(listener)
  }

  subscribe(topic: string) {
    this.clientMQTT.subscribe(topic, { qos: 1 })
  }
}
