import 'dotenv/config'
import type { Express } from 'express'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { AtualizarDispositivoUseCase } from '../../src/application/dispositivo/use-cases/atualizar-dispositivo.usecase.js'
import { CadastrarDispositivoUseCase } from '../../src/application/dispositivo/use-cases/cadastrar-dispositivo.usecase.js'
import { ListarDispositivosUseCase } from '../../src/application/dispositivo/use-cases/listar-dispositivos.usecase.js'
import { RemoverDispositivoUseCase } from '../../src/application/dispositivo/use-cases/remover-dispositivo.usecase.js'
import { MongooseDispositivoRepository } from '../../src/infra/database/dispositivo/dispositivo.repository.js'
import { MongooseORM } from '../../src/infra/database/mongoose.config.js'
import { Routes } from '../../src/infra/http/routes/routes.js'
import { ServerHTTP } from '../../src/infra/http/server.js'
import { AtualizarDispositivoController } from '../../src/interface/dispositivo/atualizar-dispositivo/atualizar-dispositivo.controller.js'
import { CadastrarDispositivoController } from '../../src/interface/dispositivo/cadastrar-dispositivo/cadastrar-dispositivo.controller.js'
import { ListarDispositivosController } from '../../src/interface/dispositivo/listar-dispositivos/listar-dispositivos.controller.js'
import { RemoverDispositivoController } from '../../src/interface/dispositivo/remover-dispositivo/remover-dispositivo.controller.js'

describe('Dispositivo E2E Tests', () => {
  let app: Express
  let orm: MongooseORM
  let tokenAutenticado: string

  // Valores diferentes para não dar conflito com o teste de Ambiente
  const mockUsuarioId = '019c3500-405e-762b-9906-f89bc4175a99'
  const mockAuthId = '019c3500-405e-762b-9906-f89bc4175a88'
  const mockAmbienteId = '019c3500-405e-762b-9906-f89bc4175a38'

  beforeAll(async () => {
    // 1. Conexão
    orm = MongooseORM.create()
    await orm.connectDatabase()

    // 2. Setup de Dependências
    const dispositivoRepo = MongooseDispositivoRepository.create()

    // Mock simples do TopicSubscriber (MQTT) exigido pelo CadastrarDispositivoUseCase
    const mockTopicSubscriber = {
      dispositivoSubscribe: async (_id: string) => Promise.resolve(),
    } as any

    const routes = Routes.create(
      null as any, // 1. criarAmbiente
      null as any, // 2. listarAmbientes
      null as any, // 3. atualizarAmbiente
      null as any, // 4. removerAmbiente
      CadastrarDispositivoController.create(
        CadastrarDispositivoUseCase.create(dispositivoRepo, mockTopicSubscriber),
      ),
      ListarDispositivosController.create(ListarDispositivosUseCase.create(dispositivoRepo)),
      AtualizarDispositivoController.create(AtualizarDispositivoUseCase.create(dispositivoRepo)),
      RemoverDispositivoController.create(RemoverDispositivoUseCase.create(dispositivoRepo)),
      null as any, // buscarMedicoes
      null as any, // buscarUltimaMedicao
      null as any, // criarUsuario
      null as any, // removerUsuario
      null as any, // ativarRecebimentoEmail
      null as any, // desativarRecebimentoEmail
      null as any, // atualizarUsuario
      null as any, // login
      null as any, // listarNotificacao
      null as any, // marcarNotificacaoLida
    ).routes

    // 3. Servidor e Token
    app = ServerHTTP.create(routes).expressApp
    tokenAutenticado = jwt.sign(
      { usuarioId: mockUsuarioId },
      process.env.JWT_SECRET || 'supersecreto',
      { expiresIn: '1h' },
    )

    // 4. Inserção de Dados Estáticos (Executado APENAS UMA VEZ por suíte)
    const db = mongoose.connection

    // Limpa sujeiras de execuções anteriores específicas deste teste
    await db.collection('usuarios').deleteMany({ id: mockUsuarioId })
    await db.collection('autenticacaos').deleteMany({ id: mockAuthId })
    await db.collection('ambientes').deleteMany({ id: mockAmbienteId })

    await db.collection('usuarios').insertOne({
      id: mockUsuarioId,
      nome: 'Teste Dispositivo',
      email: 'disp@discente.ifpe.edu.br',
      receber_email: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    await db.collection('autenticacaos').insertOne({
      id: mockAuthId,
      usuarioId: mockUsuarioId,
      senha: '$2b$10$/xnF.rBWp2ziVAd40ztXZOqPb2eosx/UXTTEu1VuWECinkrVJbIEq', // Senha mock
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Insere um ambiente fictício para associar aos dispositivos nos testes
    await db.collection('ambientes').insertOne({
      id: mockAmbienteId,
      nome: 'Sala de Teste de Dispositivos',
      tipo: 'arejado',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  })

  beforeEach(async () => {
    // 🌟 Limpa APENAS a coleção mutável deste teste para isolamento.
    await mongoose.connection.collection('dispositivos').deleteMany({})
  })

  afterAll(async () => {
    await mongoose.connection.collection('ambientes').deleteMany({ id: mockAmbienteId })
    await mongoose.connection.close()
  })

  // --- TESTES ---

  describe('POST /dispositivo - Cadastro de Dispositivo', () => {
    it('deve cadastrar um dispositivo com sucesso se receber payload válido (Caminho Feliz)', async () => {
      const payloadValido = {
        id: 'AA:BB:CC:DD:EE:11', // Endereço MAC
        nome: 'Sensor de Temperatura 01',
        ambienteId: mockAmbienteId,
      }

      const resposta = await request(app)
        .post('/dispositivo')
        .set('Cookie', [`token=${tokenAutenticado}`])
        .send(payloadValido)

      expect(resposta.status).toBe(201)
      expect(resposta.body).toHaveProperty('id')
      expect(resposta.body.id).toBe('AA:BB:CC:DD:EE:11')
    })

    it('deve falhar ao tentar cadastrar um dispositivo sem o campo obrigatório "id" (MAC)', async () => {
      const payloadInvalido = {
        nome: 'Sensor Fantasma',
        ambienteId: mockAmbienteId,
      }

      const resposta = await request(app)
        .post('/dispositivo')
        .set('Cookie', [`token=${tokenAutenticado}`])
        .send(payloadInvalido)

      expect(resposta.status).toBeGreaterThanOrEqual(400)
    })
  })

  describe('GET /dispositivo - Listagem de Dispositivos', () => {
    it('deve retornar uma lista vazia quando não houver dispositivos cadastrados', async () => {
      const resposta = await request(app)
        .get('/dispositivo')
        .set('Cookie', [`token=${tokenAutenticado}`])

      expect(resposta.status).toBe(200)
      expect(resposta.body).toStrictEqual({ dispositivos: [] })
    })

    it('deve retornar todos os dispositivos cadastrados no banco de dados', async () => {
      await request(app)
        .post('/dispositivo')
        .set('Cookie', [`token=${tokenAutenticado}`])
        .send({
          id: '11:22:33:44:55:66',
          nome: 'ESP32 - Laboratório',
          ambienteId: mockAmbienteId,
        })

      const resposta = await request(app)
        .get('/dispositivo')
        .set('Cookie', [`token=${tokenAutenticado}`])

      expect(resposta.status).toBe(200)
      expect(resposta.body.dispositivos).toHaveLength(1)
      expect(resposta.body.dispositivos[0]).toMatchObject({
        id: '11:22:33:44:55:66',
        nome: 'ESP32 - Laboratório',
        ambienteId: mockAmbienteId,
      })
    })
  })

  describe('PATCH /dispositivo/:id - Atualização de Dispositivo', () => {
    it('deve atualizar propriedades de um dispositivo existente com sucesso (Caminho Feliz)', async () => {
      const macId = 'FF:EE:DD:CC:BB:AA'

      await request(app)
        .post('/dispositivo')
        .set('Cookie', [`token=${tokenAutenticado}`])
        .send({
          id: macId,
          nome: 'Sensor Antigo',
        })

      const resposta = await request(app)
        .patch(`/dispositivo/${macId}`)
        .set('Cookie', [`token=${tokenAutenticado}`])
        .send({
          nome: 'Sensor Atualizado',
          ambienteId: mockAmbienteId,
        })

      expect(resposta.status).toBe(200)
      expect(resposta.body).toStrictEqual({ id: macId })

      const consulta = await request(app)
        .get('/dispositivo')
        .set('Cookie', [`token=${tokenAutenticado}`])

      expect(consulta.body.dispositivos[0].nome).toBe('Sensor Atualizado')
      expect(consulta.body.dispositivos[0].ambienteId).toBe(mockAmbienteId)
    })

    it('deve falhar ou retornar erro ao tentar atualizar um dispositivo inexistente', async () => {
      const idInexistente = '00:00:00:00:00:00'

      const resposta = await request(app)
        .patch(`/dispositivo/${idInexistente}`)
        .set('Cookie', [`token=${tokenAutenticado}`])
        .send({ nome: 'Tentativa de Hack' })

      expect(resposta.status).toBeGreaterThanOrEqual(400)
    })
  })

  describe('DELETE /dispositivo/:id - Deleção de Dispositivo', () => {
    it('deve deletar um dispositivo cadastrado com sucesso (Caminho Feliz)', async () => {
      const macId = '99:88:77:66:55:44'

      await request(app)
        .post('/dispositivo')
        .set('Cookie', [`token=${tokenAutenticado}`])
        .send({
          id: macId,
          nome: 'Sensor para Deletar',
        })

      const resposta = await request(app)
        .delete(`/dispositivo/${macId}`)
        .set('Cookie', [`token=${tokenAutenticado}`])

      expect(resposta.status).toBeLessThan(400)

      const verificacao = await request(app)
        .get('/dispositivo')
        .set('Cookie', [`token=${tokenAutenticado}`])

      expect(verificacao.body.dispositivos).toHaveLength(0)
    })

    it('deve retornar erro ao tentar deletar um dispositivo com id inexistente', async () => {
      const idInexistente = '12:34:56:78:90:AB'

      const resposta = await request(app)
        .delete(`/dispositivo/${idInexistente}`)
        .set('Cookie', [`token=${tokenAutenticado}`])

      expect(resposta.status).toBeGreaterThanOrEqual(400)
    })
  })
})
