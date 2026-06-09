import 'dotenv/config'
import type { Express } from 'express'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { ListarNotificacaoDoUsuarioUseCase } from '../../src/application/notificacao/use-cases/listar-notificacao-do-usuario.usecase.js'
import { MarcarComoLidaUseCase } from '../../src/application/notificacao/use-cases/marcar-como-lida.usecase.js'
import { MongooseAlertaRepository } from '../../src/infra/database/alerta/alerta.repository.js'
import { MongooseORM } from '../../src/infra/database/mongoose.config.js'
import { MongooseNotificacaoRepository } from '../../src/infra/database/notificacao/notificacao.repository.js'
import { Routes } from '../../src/infra/http/routes/routes.js'
import { ServerHTTP } from '../../src/infra/http/server.js'
import { ListarNotificacaoDoUsuarioController } from '../../src/interface/notificacao/listar-notificacao-do-usuario/listar-notificacao-do-usuario.controller.js'
import { MarcarComoLidaController } from '../../src/interface/notificacao/marcar-como-lida/marcar-como-lida.controller.js'

describe('Notificação E2E Tests - Duas Coleções', () => {
  let app: Express
  let orm: MongooseORM
  let tokenAutenticado: string

  const mockUsuarioId = '019c29c6-bc39-758e-ba3a-a62f481b3778'
  const mockAmbienteId = '019c29cb-fb11-738b-aefa-2e0cbb98d0a0'
  const mockDispositivoId = '80:F3:DA:63:4B:B8'

  // IDs para o Cenário 1 (Notificação Não Lida)
  const mockAlertaId1 = '019c29d5-5060-71ad-8b5e-3a6c035067c5'
  const mockNotificacaoId1 = '019c29d5-50e6-727b-995b-a587cd4e82b8'

  // IDs para o Cenário 2 (Notificação Já Lida)
  const mockAlertaId2 = '019c29d5-5060-71ad-8b5e-3a6c035067c6'
  const mockNotificacaoId2 = '019c29d5-50e6-727b-995b-a587cd4e82b9'

  beforeAll(async () => {
    orm = MongooseORM.create()
    await orm.connectDatabase()

    const notificacaoRepo = MongooseNotificacaoRepository.create()
    const alertaRepo = MongooseAlertaRepository.create()

    const routes = Routes.create(
      null as any,
      null as any,
      null as any,
      null as any, // 1 a 4: Ambientes
      null as any,
      null as any,
      null as any,
      null as any, // 5 a 8: Dispositivos
      null as any,
      null as any, // 9 e 10: Medições
      null as any,
      null as any,
      null as any,
      null as any, // 11 a 14: Usuários
      null as any,
      null as any, // 15 e 16: Perfil/Login
      ListarNotificacaoDoUsuarioController.create(
        ListarNotificacaoDoUsuarioUseCase.create(alertaRepo, notificacaoRepo),
      ), // 17 🌟
      MarcarComoLidaController.create(MarcarComoLidaUseCase.create(notificacaoRepo)), // 18 🌟
    ).routes

    app = ServerHTTP.create(routes).expressApp
    tokenAutenticado = jwt.sign(
      { usuarioId: mockUsuarioId },
      process.env.JWT_SECRET || 'supersecreto',
      { expiresIn: '1h' },
    )
  })

  beforeEach(async () => {
    const db = mongoose.connection

    // Limpa ambas as coleções vinculadas para garantir isolamento
    await db.collection('notificacaos').deleteMany({})
    await db.collection('alertas').deleteMany({})

    // 1. Populando a coleção de ALERTAS
    await db.collection('alertas').insertMany([
      {
        _id: mockAlertaId1 as any, // Mapeado como id/id_ no repositório
        dispositivoId: mockDispositivoId,
        ambienteId: mockAmbienteId,
        tipo: 'sensor_fora_do_range',
        nivel: 'critico',
        mensagem: 'Valor de temperatura fora do limite esperado',
        ativo: true,
        sensorTipo: 'temperatura',
        valorAtual: 29.1,
        limiteMin: 15,
        limiteMax: 25,
        createdAt: new Date('2026-02-04T18:06:11.596Z'),
        updatedAt: new Date('2026-02-04T18:06:11.596Z'),
      },
      {
        _id: mockAlertaId2 as any,
        dispositivoId: mockDispositivoId,
        ambienteId: mockAmbienteId,
        tipo: 'dispositivo_offline',
        nivel: 'atencao',
        mensagem: 'O dispositivo parou de enviar dados',
        ativo: false,
        sensorTipo: 'umidade',
        valorAtual: 0,
        limiteMin: 20,
        limiteMax: 80,
        createdAt: new Date('2026-02-04T18:10:00Z'),
        updatedAt: new Date('2026-02-04T18:10:00Z'),
      },
    ])

    // 2. Populando a coleção de NOTIFICAÇÕES (fazendo o vínculo por alertaId)
    await db.collection('notificacaos').insertMany([
      {
        _id: mockNotificacaoId1 as any,
        alertaId: mockAlertaId1, // Relacionamento com o alerta 1
        usuarioId: mockUsuarioId,
        lida: false,
        createdAt: new Date('2026-02-04T18:06:11.687Z'),
        updatedAt: new Date('2026-02-04T18:06:11.687Z'),
      },
      {
        _id: mockNotificacaoId2 as any,
        alertaId: mockAlertaId2, // Relacionamento com o alerta 2
        usuarioId: mockUsuarioId,
        lida: true, // Já inicia como lida para testar filtros se houver
        createdAt: new Date('2026-02-04T18:11:00Z'),
        updatedAt: new Date('2026-02-04T18:11:00Z'),
      },
    ])
  })

  afterAll(async () => {
    const db = mongoose.connection
    await db.collection('notificacaos').deleteMany({})
    await db.collection('alertas').deleteMany({})
    await db.close()
  })

  // --- CAMINHOS DE TESTE: GET /notificacao/{usuarioID} ---

  describe('GET /notificacao/{usuarioID} - Listar Notificações', () => {
    it('deve retornar as notificações agregadas com os dados dos alertas (Caminho Feliz)', async () => {
      const resposta = await request(app)
        .get(`/notificacao/${mockUsuarioId}`)
        .set('Cookie', [`token=${tokenAutenticado}`])

      expect(resposta.status).toBe(200)
      expect(resposta.body).toHaveProperty('notificoes')
      expect(resposta.body.notificoes).toHaveLength(2)

      const notificacaoAlvo = resposta.body.notificoes.find((n: any) => n.id === mockNotificacaoId1)

      expect(notificacaoAlvo).toMatchObject({
        id: mockNotificacaoId1,
        dispositivoId: mockDispositivoId,
        ambienteId: mockAmbienteId,
        tipo: 'sensor_fora_do_range',
        nivel: 'critico',
        mensagem: 'Valor de temperatura fora do limite esperado',
        sensorTipo: 'temperatura',
        valorAtual: 29.1,
        lida: false,
      })
    })

    it('deve retornar uma lista vazia se o usuarioId não possuir nenhuma notificação vinculada', async () => {
      const usuarioSemNotificacoes = '019c29c6-bc39-758e-ba3a-a62f481b3700'

      const resposta = await request(app)
        .get(`/notificacao/${usuarioSemNotificacoes}`)
        .set('Cookie', [`token=${tokenAutenticado}`])

      expect(resposta.status).toBe(200)
      expect(resposta.body).toStrictEqual({ notificoes: [] })
    })
  })

  // --- CAMINHOS DE TESTE: PATCH/POST /notificacao/{usuarioID} ---

  describe('POST /notificacao/{usuarioID} - Marcar como Lida', () => {
    it('deve atualizar o status "lida" para true na coleção de notificações (Caminho Feliz)', async () => {
      const resposta = await request(app)
        .post(`/notificacao/`)
        .set('Cookie', [`token=${tokenAutenticado}`])
        .send({ notificacaoId: mockNotificacaoId1 })

      expect(resposta.status).toBeLessThan(400) // 200 ou 204

      // Verificação no banco/rota de leitura se o estado mudou de fato
      const checagem = await request(app)
        .get(`/notificacao/${mockUsuarioId}`)
        .set('Cookie', [`token=${tokenAutenticado}`])

      const alvo = checagem.body.notificoes.find((n: any) => n.id === mockNotificacaoId1)
      expect(alvo.lida).toBe(true)
    })

    it('deve falhar com erro 400 se o campo "notificacaoId" for omitido no payload', async () => {
      const resposta = await request(app)
        .post(`/notificacao/`)
        .set('Cookie', [`token=${tokenAutenticado}`])
        .send({}) // Corpo vazio invoca erro do Zod

      expect(resposta.status).toBe(400)
    })

    it('deve retornar erro se o "notificacaoId" enviado não existir no banco', async () => {
      const idInexistente = '019c29d5-50e6-727b-995b-a00000000000'

      const resposta = await request(app)
        .post(`/notificacao/`)
        .set('Cookie', [`token=${tokenAutenticado}`])
        .send({ notificacaoId: idInexistente })

      expect(resposta.status).toBeGreaterThanOrEqual(400) // 404 Not Found esperado pela regra de negócio
    })
  })
})
