import type { CadastrarMedicaoController } from '@/interface/medicao/cadastrar-medicao/cadastrar-medicao.controller.js'
import mqtt, { type MqttClient } from 'mqtt'

export type clientOptions = {
  username: string
  password: string
}

export class ClientMQTT {
  private readonly clientMQTT: MqttClient

  private constructor(
    options: clientOptions,
    private readonly cadastrarMedicaoController: CadastrarMedicaoController,
  ) {
    this.clientMQTT = mqtt.connect(process.env.BROKER_URL || 'mqtt://test.mosquitto.org', options)
    this.eventHandle()
  }

  public static create(cadastrarMedicaoController: CadastrarMedicaoController) {
    const options: clientOptions = {
      username: process.env.BROKER_CLIENT_USERNAME || '',
      password: process.env.BROKER_CLIENT_PASSWORD || '',
    }
    return new ClientMQTT(options, cadastrarMedicaoController)
  }

  private eventHandle() {
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

    this.clientMQTT.on('message', (topic, message, _packet) => {
      const parts = topic.split('/')
      const dispositivoId = parts[2]
      const tipo = parts[3]
      this.cadastrarMedicaoController.handle({ dispositivoId, tipo, valor: message })
    })
  }

  public subscribeTopic(deviceId: string) {
    this.clientMQTT.subscribe(`/device/${deviceId}/umidade`, { qos: 1 })
    this.clientMQTT.subscribe(`/device/${deviceId}/temperatura`, { qos: 1 })
  }
}
