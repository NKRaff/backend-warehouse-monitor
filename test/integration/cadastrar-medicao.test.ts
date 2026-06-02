import 'dotenv/config'
import mongoose from 'mongoose'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { CadastrarMedicaoUseCase } from '../../src/application/medicao/use-cases/cadastrar-medicao.usecase.js'
import { MongooseAlertaRepository } from '../../src/infra/database/alerta/alerta.repository.js'
import { MongooseAmbienteRepository } from '../../src/infra/database/ambiente/ambiente.repository.js'
import { MongooseDispositivoRepository } from '../../src/infra/database/dispositivo/dispositivo.repository.js'
import { MongooseMedicaoRepository } from '../../src/infra/database/medicao/medicao.repository.js'
import { MongooseORM } from '../../src/infra/database/mongoose.config.js'
import { MongooseNotificacaoRepository } from '../../src/infra/database/notificacao/notificacao.repository.js'
import { MongooseUsuarioRepository } from '../../src/infra/database/usuario/usuario.repository.js'
import type { Mailer } from '../../src/infra/smtp/mailer.interface.js'
import { CadastrarMedicaoController } from '../../src/interface/medicao/cadastrar-medicao/cadastrar-medicao.controller.js'

describe('Cadastrar Medição (MQTT) Tests', () => {
  let orm: MongooseORM
  let controller: CadastrarMedicaoController
  let mailerMock: Mailer

  const mockUsuarioId = '019c3500-405e-762b-9906-f89bc4175a99'
  const mockAmbienteId = '019c3500-405e-762b-9906-f89bc4175a38'
  const mockDispositivoId = 'AA:BB:CC:DD:EE:11'

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

    // 3. Mock do Mailer (Evita enviar e-mails reais durante o teste)
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
  })

  beforeEach(async () => {
    const db = mongoose.connection

    // Limpa todas as coleções envolvidas
    await db.collection('medicaos').deleteMany({})
    await db.collection('alertas').deleteMany({})
    await db.collection('notificacaos').deleteMany({})
    await db.collection('usuarios').deleteMany({})
    await db.collection('ambientes').deleteMany({})
    await db.collection('dispositivos').deleteMany({})

    // Reseta o contador de chamadas do mock de e-mail
    vi.clearAllMocks()

    // 🌟 1. Correção no Usuário: _id e receber_email
    await db.collection('usuarios').insertOne({
      _id: mockUsuarioId as any,
      nome: 'Usuário Teste',
      email: 'teste@dominio.com',
      receber_email: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      __v: 0,
    })

    // 🌟 2. Correção no Ambiente: _id e limites planos (snake_case)
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

    // 🌟 3. Correção no Dispositivo: _id e remoção do campo 'ativo'
    await db.collection('dispositivos').insertOne({
      _id: mockDispositivoId as any,
      nome: 'Sensor Principal',
      ambienteId: mockAmbienteId,
      createdAt: new Date(),
      updatedAt: new Date(),
      __v: 0,
    })
  })

  afterAll(async () => {
    await mongoose.connection.close()
  })

  // --- SUÍTE DE TESTES ---

  it('deve cadastrar uma medição válida dentro dos limites sem gerar alertas', async () => {
    // Simulando a chegada de uma mensagem MQTT (Temperatura normal: 22.5)
    const mqttMessage = {
      topic: `${mockDispositivoId}/temperatura`,
      payload: Buffer.from('22.5'),
    }

    await controller.handle(mqttMessage)

    // Verifica no banco se a medição foi salva
    const db = mongoose.connection
    const medicoes = await db.collection('medicaos').find().toArray()
    const alertas = await db.collection('alertas').find().toArray()

    expect(medicoes).toHaveLength(1)
    expect(medicoes[0].valor).toBe(22.5)
    expect(medicoes[0].tipo).toBe('temperatura')
    expect(medicoes[0].dispositivoId).toBe(mockDispositivoId)

    // Garante que nenhum alerta ou e-mail foi disparado
    expect(alertas).toHaveLength(0)
    expect(mailerMock.sendMail).not.toHaveBeenCalled()
  })

  it('deve gerar alerta, criar notificação e enviar e-mail ao receber medição fora do limite', async () => {
    // Simulando uma temperatura muito alta (35.0), acima do limite de 30.0 do ambiente
    const mqttMessage = {
      topic: `${mockDispositivoId}/temperatura`,
      payload: Buffer.from('35.0'),
    }

    await controller.handle(mqttMessage)

    const db = mongoose.connection
    const alertas = await db.collection('alertas').find().toArray()
    const notificacoes = await db.collection('notificacaos').find().toArray()

    // Verifica se o Alerta foi gerado
    expect(alertas).toHaveLength(1)
    expect(alertas[0].ativo).toBe(true)
    expect(alertas[0].tipo).toBe('sensor_fora_do_range') // ou a tipagem de alerta que sua entidade cria

    // Verifica se a Notificação foi gerada para o Usuário
    expect(notificacoes).toHaveLength(1)
    expect(notificacoes[0].usuarioId).toBe(mockUsuarioId)
    expect(notificacoes[0].alertaId).toBe(alertas[0]._id)

    // Verifica se a função de enviar e-mail foi chamada
    expect(mailerMock.sendMail).toHaveBeenCalledTimes(1)
    expect(mailerMock.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'teste@dominio.com',
        subject: 'Teste de email', // Conforme hardcoded no seu UseCase
      }),
    )
  })

  it('deve encerrar um alerta ativo se a nova medição voltar ao padrão (limites normais)', async () => {
    const db = mongoose.connection

    // Primeiro disparamos uma medição ruim (Gera alerta)
    await controller.handle({
      topic: `${mockDispositivoId}/temperatura`,
      payload: Buffer.from('35.0'), // Acima do limite
    })

    const alertasAbertos = await db.collection('alertas').find({ ativo: true }).toArray()
    expect(alertasAbertos).toHaveLength(1)

    // Depois enviamos uma medição boa (Resolve alerta)
    await controller.handle({
      topic: `${mockDispositivoId}/temperatura`,
      payload: Buffer.from('24.0'), // Dentro do limite
    })

    const alertasAposResolucao = await db.collection('alertas').find().toArray()

    expect(alertasAposResolucao).toHaveLength(1) // O registro ainda existe
    expect(alertasAposResolucao[0].ativo).toBe(false) // Mas foi desativado/encerrado
  })

  it('deve rejeitar a operação se o dispositivoId não existir no banco', async () => {
    const mqttMessage = {
      topic: `00:00:00:00:00:00/umidade`,
      payload: Buffer.from('50.0'),
    }

    await expect(controller.handle(mqttMessage)).rejects.toThrow(
      'Nenhum dispositivo com esse Id encontrado',
    )
  })

  it('deve rejeitar a operação se o dispositivo não estiver associado a um ambiente', async () => {
    const db = mongoose.connection
    const dispositivoSemAmbiente = 'BB:BB:CC:DD:EE:22'

    await db.collection('dispositivos').insertOne({
      _id: dispositivoSemAmbiente as any, // 🌟 Corrigido para _id
      nome: 'Sensor Solto',
      ambienteId: null, // Sem ambiente
      createdAt: new Date(),
      updatedAt: new Date(),
      __v: 0,
    })

    const mqttMessage = {
      topic: `${dispositivoSemAmbiente}/temperatura`,
      payload: Buffer.from('20.0'),
    }

    await expect(controller.handle(mqttMessage)).rejects.toThrow(
      'Não é possível registrar medição: dispositivo não está associado a um ambiente.',
    )
  })
})
