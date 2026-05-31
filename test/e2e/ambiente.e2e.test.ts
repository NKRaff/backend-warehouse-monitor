import 'dotenv/config'
import type { Express } from 'express'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { AtualizarAmbienteUseCase } from '../../src/application/ambiente/use-cases/atualizar-ambiente.usecase.js'
import { CriarAmbienteUseCase } from '../../src/application/ambiente/use-cases/criar-ambiente.usecase.js'
import { ListarAmbientesUseCase } from '../../src/application/ambiente/use-cases/listar-ambientes.usecase.js'
import { RemoverAmbienteUseCase } from '../../src/application/ambiente/use-cases/remover-ambiente.usecase.js'
import { MongooseAmbienteRepository } from '../../src/infra/database/ambiente/ambiente.repository.js'
import { MongooseDispositivoRepository } from '../../src/infra/database/dispositivo/dispositivo.repository.js'
import { MongooseORM } from '../../src/infra/database/mongoose.config.js'
import { Routes } from '../../src/infra/http/routes/routes.js'
import { ServerHTTP } from '../../src/infra/http/server.js'
import { AtualizarAmbienteController } from '../../src/interface/ambiente/atualizar-ambientes/atualizar-ambientes.controller.js'
import { CriarAmbienteController } from '../../src/interface/ambiente/criar-ambientes/criar-ambiente.controller.js'
import { ListarAmbientesController } from '../../src/interface/ambiente/listar-ambiestes/listar-ambientes.controller.js'
import { RemoverAmbienteController } from '../../src/interface/ambiente/remover-ambiente/remover-ambiente.controller.js'

describe('Ambiente E2E Tests', () => {
  let app: Express
  let orm: MongooseORM
  let tokenAutenticado: string

  const mockUsuarioId = '019c29c6-bc39-758e-ba3a-a62f481b3778'
  const mockAuthId = '019c29c6-bc39-758e-ba3a-a860155df871'

  beforeAll(async () => {
    // 1. Conexão
    orm = MongooseORM.create()
    await orm.connectDatabase()

    // 2. Setup de Dependências
    const ambienteRepo = MongooseAmbienteRepository.create()
    const dispositivoRepo = MongooseDispositivoRepository.create()

    const routes = Routes.create(
      CriarAmbienteController.create(CriarAmbienteUseCase.create(ambienteRepo)),
      ListarAmbientesController.create(ListarAmbientesUseCase.create(ambienteRepo)),
      AtualizarAmbienteController.create(AtualizarAmbienteUseCase.create(ambienteRepo)),
      RemoverAmbienteController.create(
        RemoverAmbienteUseCase.create(ambienteRepo, dispositivoRepo),
      ),
      null as any,
      null as any,
      null as any,
      null as any,
      null as any,
      null as any,
      null as any,
      null as any,
      null as any,
      null as any,
      null as any,
      null as any,
      null as any,
      null as any,
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

    // Limpa possíveis sujeiras de execuções anteriores
    await db.collection('usuarios').deleteMany({})
    await db.collection('autenticacoes').deleteMany({})

    await db.collection('usuarios').insertOne({
      id: mockUsuarioId,
      nome: 'Rafael',
      email: 'rfr@discente.ifpe.edu.br',
      receber_email: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    await db.collection('autenticacoes').insertOne({
      id: mockAuthId,
      usuarioId: mockUsuarioId,
      senha: '$2b$10$/xnF.rBWp2ziVAd40ztXZOqPb2eosx/UXTTEu1VuWECinkrVJbIEq',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  })

  beforeEach(async () => {
    // 🌟 Limpa APENAS a coleção mutável deste teste. Muito mais rápido que iterar todas as coleções.
    await mongoose.connection.collection('ambientes').deleteMany({})
  })

  afterAll(async () => {
    await mongoose.connection.close()
  })

  // --- TESTES ---

  describe('POST /ambiente - Cadastro de Ambiente', () => {
    it('deve cadastrar um ambiente com sucesso se receber payload válido (Caminho Feliz)', async () => {
      const payloadValido = {
        nome: 'Sala de Servidores 01',
        tipo: 'frio',
        descricao: 'Ambiente refrigerado para servidores de produção',
        temperatura_minima: 16,
        temperatura_maxima: 22,
        umidade_minima: 40,
        umidade_maxima: 60,
      }

      const resposta = await request(app)
        .post('/ambiente')
        .set('Cookie', [`token=${tokenAutenticado}`])
        .send(payloadValido)

      expect(resposta.status).toBe(201)
      expect(resposta.body).toHaveProperty('id')
      expect(typeof resposta.body.id).toBe('string')
    })

    it('deve falhar ao tentar cadastrar um ambiente com tipo inválido (Caminho Não Feliz)', async () => {
      const payloadInvalido = {
        nome: 'Estufa Química',
        tipo: 'quente',
        temperatura_minima: 30,
        temperatura_maxima: 45,
        umidade_minima: 10,
        umidade_maxima: 30,
      }

      const resposta = await request(app)
        .post('/ambiente')
        .set('Cookie', [`token=${tokenAutenticado}`])
        .send(payloadInvalido)

      expect(resposta.status).toBeGreaterThanOrEqual(400)
    })
  })

  describe('GET /ambiente - Listagem de Ambientes', () => {
    it('deve retornar uma lista vazia quando não houver ambientes cadastrados', async () => {
      const resposta = await request(app)
        .get('/ambiente')
        .set('Cookie', [`token=${tokenAutenticado}`])

      expect(resposta.status).toBe(200)
      expect(resposta.body).toStrictEqual({ ambientes: [] })
    })

    it('deve retornar todos os ambientes cadastrados no banco de dados', async () => {
      const setupRes = await request(app)
        .post('/ambiente')
        .set('Cookie', [`token=${tokenAutenticado}`])
        .send({
          nome: 'Almoxarifado Principal',
          tipo: 'arejado',
          descricao: 'Estoque Central',
          temperatura_minima: 20,
          temperatura_maxima: 26,
          umidade_minima: 30,
          umidade_maxima: 50,
        })

      const resposta = await request(app)
        .get('/ambiente')
        .set('Cookie', [`token=${tokenAutenticado}`])

      expect(resposta.status).toBe(200)
      expect(resposta.body.ambientes).toHaveLength(1)
      expect(resposta.body.ambientes[0]).toMatchObject({
        id: setupRes.body.id,
        nome: 'Almoxarifado Principal',
        tipo: 'arejado',
        descricao: 'Estoque Central',
      })
    })
  })

  describe('PATCH /ambiente/:id - Atualização de Ambiente', () => {
    it('deve atualizar propriedades de um ambiente existente com sucesso (Caminho Feliz)', async () => {
      const setupRes = await request(app)
        .post('/ambiente')
        .set('Cookie', [`token=${tokenAutenticado}`])
        .send({
          nome: 'Laboratório A',
          tipo: 'frio',
          temperatura_minima: 15,
          temperatura_maxima: 20,
          umidade_minima: 40,
          umidade_maxima: 60,
        })

      const resposta = await request(app)
        .patch(`/ambiente/${setupRes.body.id}`)
        .set('Cookie', [`token=${tokenAutenticado}`])
        .send({
          nome: 'Laboratório A - Modificado',
          descricao: 'Nova descrição adicionada',
          temperatura_maxima: 18,
        })

      expect(resposta.status).toBe(200)
      expect(resposta.body).toStrictEqual({ id: setupRes.body.id })

      const consulta = await request(app)
        .get('/ambiente')
        .set('Cookie', [`token=${tokenAutenticado}`])

      expect(consulta.body.ambientes[0].nome).toBe('Laboratório A - Modificado')
    })

    it('deve falhar ou retornar erro ao tentar atualizar um id inexistente', async () => {
      const idInexistente = new mongoose.Types.ObjectId().toString()

      const resposta = await request(app)
        .patch(`/ambiente/${idInexistente}`)
        .set('Cookie', [`token=${tokenAutenticado}`])
        .send({ nome: 'Nome Fantasma' })

      expect(resposta.status).toBeGreaterThanOrEqual(400)
    })
  })

  describe('DELETE /ambiente/:id - Deleção de Ambiente', () => {
    it('deve deletar um ambiente cadastrado com sucesso (Caminho Feliz)', async () => {
      const setupRes = await request(app)
        .post('/ambiente')
        .set('Cookie', [`token=${tokenAutenticado}`])
        .send({
          nome: 'Sala para Deletar',
          tipo: 'arejado',
          temperatura_minima: 18,
          temperatura_maxima: 25,
          umidade_minima: 30,
          umidade_maxima: 50,
        })

      const resposta = await request(app)
        .delete(`/ambiente/${setupRes.body.id}`)
        .set('Cookie', [`token=${tokenAutenticado}`])

      expect(resposta.status).toBeLessThan(400)

      const verificacao = await request(app)
        .get('/ambiente')
        .set('Cookie', [`token=${tokenAutenticado}`])

      expect(verificacao.body.ambientes).toHaveLength(0)
    })

    it('deve retornar erro ao tentar deletar um ambiente com id inválido ou inexistente', async () => {
      const idInexistente = new mongoose.Types.ObjectId().toString()

      const resposta = await request(app)
        .delete(`/ambiente/${idInexistente}`)
        .set('Cookie', [`token=${tokenAutenticado}`])

      expect(resposta.status).toBeGreaterThanOrEqual(400)
    })
  })
})
