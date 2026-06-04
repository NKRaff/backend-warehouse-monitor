import 'dotenv/config'
import mongoose from 'mongoose'
import mqtt from 'mqtt' // Importando para atuar como o dispositivo publicador
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { CadastrarMedicaoUseCase } from '../../src/application/medicao/use-cases/cadastrar-medicao.usecase.js'
import { MongooseAlertaRepository } from '../../src/infra/database/alerta/alerta.repository.js'
import { MongooseAmbienteRepository } from '../../src/infra/database/ambiente/ambiente.repository.js'
import { MongooseDispositivoRepository } from '../../src/infra/database/dispositivo/dispositivo.repository.js'
import { MongooseMedicaoRepository } from '../../src/infra/database/medicao/medicao.repository.js'
import { MongooseORM } from '../../src/infra/database/mongoose.config.js'
import { MongooseNotificacaoRepository } from '../../src/infra/database/notificacao/notificacao.repository.js'
import { MongooseUsuarioRepository } from '../../src/infra/database/usuario/usuario.repository.js'
import { ClientMQTT } from '../../src/infra/mqtt/client.js'
import { MqttTopicSubscriber } from '../../src/infra/mqtt/topic-subscriber.js'
import type { Mailer } from '../../src/infra/smtp/mailer.interface.js'
import { CadastrarMedicaoController } from '../../src/interface/medicao/cadastrar-medicao/cadastrar-medicao.controller.js'

// Utilitário para aguardar o tempo de tráfego de rede do MQTT e processamento do DB
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

describe('Cadastrar Medição (MQTT E2E) Tests', () => {
  let orm: MongooseORM
  let controller: CadastrarMedicaoController
  let mailerMock: Mailer

  // Clientes MQTT
  let appMqttClient: ClientMQTT
  let topicSubscriber: MqttTopicSubscriber
  let deviceMqttClient: mqtt.MqttClient // Simula o hardware/dispositivo

  // Variável para capturar erros assíncronos que ocorrem dentro do listener do MQTT
  let lastAsyncError: Error | null = null

  const mockUsuarioId = '019c3500-405e-762b-9906-f89bc4175a99'
  const mockAmbienteId = '019c3500-405e-762b-9906-f89bc4175a38'
  const mockDispositivoId = 'AA:BB:CC:DD:EE:11'
  const mockDispositivoSemAmbienteId = 'BB:BB:CC:DD:EE:22'

  beforeAll(async () => {
    // 1. Conexão com o Banco
    orm = MongooseORM.create()
    await orm.connectDatabase()

    // 2. Instanciando Repositórios Reais
    const medicaoRepo = MongooseMedicaoRepository.create()
    const dispositivoRepo = MongooseDispositivoRepository.create()
    const ambienteRepo = MongooseAmbienteRepository.create()
    const alertaRepo = MongooseAlertaRepository.create()
    const usuarioRepo = MongooseUsuarioRepository.create()
    const notificacaoRepo = MongooseNotificacaoRepository.create()

    // 3. Mock do Mailer
    mailerMock = {
      sendMail: vi.fn().mockResolvedValue(undefined),
    } as unknown as Mailer

    // 4. Instanciando o Caso de Uso e o Controller
    const useCase = CadastrarMedicaoUseCase.create(
      medicaoRepo,
      dispositivoRepo,
      ambienteRepo,
      alertaRepo,
      usuarioRepo,
      notificacaoRepo,
      mailerMock,
    )
    controller = CadastrarMedicaoController.create(useCase)

    // 🌟 5. Configuração E2E: Cliente MQTT da Aplicação (Recebedor)
    appMqttClient = ClientMQTT.create()
    topicSubscriber = MqttTopicSubscriber.create(appMqttClient)

    appMqttClient.onMessage(async (message) => {
      try {
        await controller.handle(message)
      } catch (error) {
        lastAsyncError = error as Error
      }
    })

    // Inscreve a aplicação nos tópicos dos dispositivos de teste
    await topicSubscriber.dispositivoSubscribe(mockDispositivoId)
    await topicSubscriber.dispositivoSubscribe('00:00:00:00:00:00') // Dispositivo Inexistente
    await topicSubscriber.dispositivoSubscribe(mockDispositivoSemAmbienteId)

    // 🌟 6. Configuração E2E: Cliente MQTT do Dispositivo (Publicador)
    const brokerUrl = process.env.BROKER_URL || 'mqtt://test.mosquitto.org'
    deviceMqttClient = mqtt.connect(brokerUrl, {
      username: process.env.BROKER_CLIENT_USERNAME || '',
      password: process.env.BROKER_CLIENT_PASSWORD || '',
    })

    // Aguarda o publicador se conectar antes de iniciar os testes
    await new Promise<void>((resolve) => {
      deviceMqttClient.on('connect', () => resolve())
    })
  })

  beforeEach(async () => {
    const db = mongoose.connection
    lastAsyncError = null // Reseta os erros capturados

    // Limpa todas as coleções envolvidas
    await db.collection('medicaos').deleteMany({})
    await db.collection('alertas').deleteMany({})
    await db.collection('notificacaos').deleteMany({})
    await db.collection('usuarios').deleteMany({})
    await db.collection('ambientes').deleteMany({})
    await db.collection('dispositivos').deleteMany({})

    vi.clearAllMocks()

    // Popula Banco de Dados
    await db.collection('usuarios').insertOne({
      _id: mockUsuarioId as any,
      nome: 'Usuário Teste',
      email: 'teste@dominio.com',
      receber_email: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      __v: 0,
    })

    await db.collection('ambientes').insertOne({
      _id: mockAmbienteId as any,
      nome: 'Laboratório de Testes',
      tipo: 'arejado',
      descricao: 'Ambiente de testes automatizados',
      temperatura_minima: 15.0,
      temperatura_maxima: 30.0,
      umidade_minima: 30.0,
      umidade_maxima: 70.0,
      createdAt: new Date(),
      updatedAt: new Date(),
      __v: 0,
    })

    await db.collection('dispositivos').insertOne({
      _id: mockDispositivoId as any,
      nome: 'Sensor Principal',
      ambienteId: mockAmbienteId,
      createdAt: new Date(),
      updatedAt: new Date(),
      __v: 0,
    })

    await db.collection('dispositivos').insertOne({
      _id: mockDispositivoSemAmbienteId as any,
      nome: 'Sensor Solto',
      ambienteId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      __v: 0,
    })
  })

  afterAll(async () => {
    await mongoose.connection.close()

    // Encerra as conexões MQTT para não travar o runner de testes
    deviceMqttClient.end()
    appMqttClient.disconnect()
  })

  // --- SUÍTE DE TESTES E2E ---

  it('deve cadastrar uma medição válida dentro dos limites sem gerar alertas via MQTT', async () => {
    // Ação: Publica no broker simulando o hardware
    deviceMqttClient.publish(`${mockDispositivoId}/temperatura`, '22.5', { qos: 1 })

    // Aguarda tempo suficiente para a mensagem ir ao broker, voltar, e o mongo processar
    await sleep(500)

    // Assert: Verifica estado no banco
    const db = mongoose.connection
    const medicoes = await db.collection('medicaos').find().toArray()
    const alertas = await db.collection('alertas').find().toArray()

    expect(lastAsyncError).toBeNull()
    expect(medicoes).toHaveLength(1)
    expect(medicoes[0].valor).toBe(22.5)
    expect(medicoes[0].tipo).toBe('temperatura')
    expect(medicoes[0].dispositivoId).toBe(mockDispositivoId)

    expect(alertas).toHaveLength(0)
    expect(mailerMock.sendMail).not.toHaveBeenCalled()
  })

  it('deve gerar alerta, criar notificação e enviar e-mail ao receber medição fora do limite', async () => {
    deviceMqttClient.publish(`${mockDispositivoId}/temperatura`, '35.0', { qos: 1 })

    await sleep(500)

    const db = mongoose.connection
    const alertas = await db.collection('alertas').find().toArray()
    const notificacoes = await db.collection('notificacaos').find().toArray()

    expect(lastAsyncError).toBeNull()
    expect(alertas).toHaveLength(1)
    expect(alertas[0].ativo).toBe(true)

    expect(notificacoes).toHaveLength(1)
    expect(notificacoes[0].usuarioId).toBe(mockUsuarioId)
    expect(notificacoes[0].alertaId).toBe(alertas[0]._id)

    expect(mailerMock.sendMail).toHaveBeenCalledTimes(1)
    expect(mailerMock.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'teste@dominio.com',
      }),
    )
  })

  it('deve encerrar um alerta ativo se a nova medição voltar ao padrão (limites normais)', async () => {
    const db = mongoose.connection

    // Envia medição ruim
    deviceMqttClient.publish(`${mockDispositivoId}/temperatura`, '35.0', { qos: 1 })
    await sleep(500)

    const alertasAbertos = await db.collection('alertas').find({ ativo: true }).toArray()
    expect(alertasAbertos).toHaveLength(1)

    // Envia medição boa
    deviceMqttClient.publish(`${mockDispositivoId}/temperatura`, '24.0', { qos: 1 })
    await sleep(500)

    const alertasAposResolucao = await db.collection('alertas').find().toArray()
    expect(alertasAposResolucao).toHaveLength(1)
    expect(alertasAposResolucao[0].ativo).toBe(false)
  })

  it('deve rejeitar a operação se o dispositivoId não existir no banco', async () => {
    deviceMqttClient.publish(`00:00:00:00:00:00/umidade`, '50.0', { qos: 1 })
    await sleep(500)

    // Como é E2E event-driven, verificamos o erro capturado no listener global
    expect(lastAsyncError).not.toBeNull()
    expect(lastAsyncError?.message).toBe('Nenhum dispositivo com esse Id encontrado')
  })

  it('deve rejeitar a operação se o dispositivo não estiver associado a um ambiente', async () => {
    deviceMqttClient.publish(`${mockDispositivoSemAmbienteId}/temperatura`, '20.0', { qos: 1 })
    await sleep(500)

    expect(lastAsyncError).not.toBeNull()
    expect(lastAsyncError?.message).toBe(
      'Não é possível registrar medição: dispositivo não está associado a um ambiente.',
    )
  })
})
