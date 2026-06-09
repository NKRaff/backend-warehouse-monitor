import 'dotenv/config'
import type { Express } from 'express'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { BuscarMedicaoUseCase } from '../../src/application/medicao/use-cases/buscar-medicoes.usecase.js'
import { BuscarUltimaMedicaoUseCase } from '../../src/application/medicao/use-cases/buscar-ultima-medicao.usecase.js'
import { MongooseMedicaoRepository } from '../../src/infra/database/medicao/medicao.repository.js'
import { MongooseORM } from '../../src/infra/database/mongoose.config.js'
import { Routes } from '../../src/infra/http/routes/routes.js'
import { ServerHTTP } from '../../src/infra/http/server.js'
import { BuscarMedicoesController } from '../../src/interface/medicao/buscar-medicoes/buscar-medicoes.controller.js'
import { BuscarUltimaMedicaoController } from '../../src/interface/medicao/buscar-ultima-medicao/buscar-ultima-medicao.controller.js'

describe('Medição E2E Tests', () => {
  let app: Express
  let orm: MongooseORM
  let tokenAutenticado: string

  const mockUsuarioId = '019c3500-405e-762b-9906-f89bc4175a99'
  const mockAmbienteId = '019c3500-405e-762b-9906-f89bc4175a38'
  const mockDispositivoId = 'AA:BB:CC:DD:EE:11'

  beforeAll(async () => {
    // 1. Conexão com o Banco
    orm = MongooseORM.create()
    await orm.connectDatabase()

    // 2. Setup de Dependências das Medições
    const medicaoRepo = MongooseMedicaoRepository.create()

    const routes = Routes.create(
      null as any, // 1. criarAmbiente
      null as any, // 2. listarAmbientes
      null as any, // 3. atualizarAmbiente
      null as any, // 4. removerAmbiente
      null as any, // 5. cadastrarDispositivo
      null as any, // 6. listarDispositivos
      null as any, // 7. atualizarDispositivo
      null as any, // 8. removerDispositivo
      BuscarMedicoesController.create(BuscarMedicaoUseCase.create(medicaoRepo)), // 9. buscarMedicoes 🌟
      BuscarUltimaMedicaoController.create(BuscarUltimaMedicaoUseCase.create(medicaoRepo)), // 10. buscarUltimaMedicao 🌟
      null as any, // 11. criarUsuario
      null as any, // 12. removerUsuario
      null as any, // 13. ativarRecebimentoEmail
      null as any, // 14. desativarRecebimentoEmail
      null as any, // 15. atualizarUsuario
      null as any, // 16. login
      null as any, // 17. listarNotificacao
      null as any, // 18. marcarNotificacaoLida
    ).routes

    // 3. Servidor e Token de Autenticação
    app = ServerHTTP.create(routes).expressApp
    tokenAutenticado = jwt.sign(
      { usuarioId: mockUsuarioId },
      process.env.JWT_SECRET || 'supersecreto',
      { expiresIn: '1h' },
    )

    // 4. Inserção de Massa de Dados Controlada para os Filtros
    const db = mongoose.connection

    // Limpa registros antigos para evitar poluição
    await db.collection('medicaos').deleteMany({ dispositivoId: mockDispositivoId })

    await db.collection('medicaos').insertMany([
      {
        _id: 'medicao-id-01' as any,
        dispositivoId: mockDispositivoId,
        ambienteId: mockAmbienteId,
        tipo: 'temperatura',
        valor: 22.5,
        createdAt: new Date('2026-06-01T10:00:00Z'),
        updatedAt: new Date('2026-06-01T10:00:00Z'),
      },
      {
        _id: 'medicao-id-02' as any,
        dispositivoId: mockDispositivoId,
        ambienteId: mockAmbienteId,
        tipo: 'temperatura',
        valor: 26.8, // Medição mais recente de temperatura
        createdAt: new Date('2026-06-01T11:00:00Z'),
        updatedAt: new Date('2026-06-01T11:00:00Z'),
      },
      {
        _id: 'medicao-id-03' as any,
        dispositivoId: mockDispositivoId,
        ambienteId: mockAmbienteId,
        tipo: 'umidade',
        valor: 65.0, // Medição mais recente de umidade
        createdAt: new Date('2026-06-01T10:30:00Z'),
        updatedAt: new Date('2026-06-01T10:30:00Z'),
      },
    ])
  })

  afterAll(async () => {
    const db = mongoose.connection
    await db.collection('medicaos').deleteMany({ dispositivoId: mockDispositivoId })
    await db.close()
  })

  // --- SUÍTE DE TESTES: BUSCAR POR FILTROS ---

  describe('POST /medicao/buscar - Buscar Medições por Filtros', () => {
    it('deve retornar todas as medições de um dispositivo específico', async () => {
      const resposta = await request(app)
        .post('/medicao/buscar')
        .set('Cookie', [`token=${tokenAutenticado}`])
        .send({ dispositivoId: mockDispositivoId })

      expect(resposta.status).toBe(200)
      expect(resposta.body).toHaveProperty('medicoes')
      expect(resposta.body.medicoes).toHaveLength(3)
    })

    it('deve filtrar medições corretamente por tipo (temperatura)', async () => {
      const resposta = await request(app)
        .post('/medicao/buscar')
        .set('Cookie', [`token=${tokenAutenticado}`])
        .send({ tipo: 'temperatura' })

      expect(resposta.status).toBe(200)
      expect(resposta.body.medicoes).toHaveLength(2)
      expect(resposta.body.medicoes.every((m: any) => m.tipo === 'temperatura')).toBe(true)
    })

    it('deve filtrar medições por intervalo de valores (minValor e maxValor)', async () => {
      const resposta = await request(app)
        .post('/medicao/buscar')
        .set('Cookie', [`token=${tokenAutenticado}`])
        .send({
          minValor: 20,
          maxValor: 24,
        })

      expect(resposta.status).toBe(200)
      expect(resposta.body.medicoes).toHaveLength(1)
      expect(resposta.body.medicoes[0].valor).toBe(22.5)
    })

    it('deve filtrar medições por intervalo de datas (startData e endData)', async () => {
      const resposta = await request(app)
        .post('/medicao/buscar')
        .set('Cookie', [`token=${tokenAutenticado}`])
        .send({
          startData: new Date('2026-06-01T09:30:00Z'),
          endData: new Date('2026-06-01T10:15:00Z'),
        })

      expect(resposta.status).toBe(200)
      expect(resposta.body.medicoes).toHaveLength(1)
      expect(resposta.body.medicoes[0].id).toBe('medicao-id-01')
    })

    it('deve retornar uma lista vazia caso nenhum registro coincida com os filtros', async () => {
      const resposta = await request(app)
        .post('/medicao/buscar')
        .set('Cookie', [`token=${tokenAutenticado}`])
        .send({ dispositivoId: '00:00:00:00:00:00' })

      expect(resposta.status).toBe(200)
      expect(resposta.body).toStrictEqual({ medicoes: [] })
    })
  })

  // --- SUÍTE DE TESTES: BUSCAR ÚLTIMA MEDIÇÃO ---

  describe('POST /medicao/buscar-ultima - Buscar Última Medição', () => {
    it('deve retornar a última medição de temperatura registrada cronologicamente', async () => {
      const resposta = await request(app)
        .post('/medicao/buscar-ultima')
        .set('Cookie', [`token=${tokenAutenticado}`])
        .send({
          dispositivoId: mockDispositivoId,
          tipo: 'temperatura',
        })

      expect(resposta.status).toBe(200)
      expect(resposta.body.id).toBe('medicao-id-02') // Criada às 11:00h
      expect(resposta.body.valor).toBe(26.8)
    })

    it('deve retornar a última medição de umidade registrada cronologicamente', async () => {
      const resposta = await request(app)
        .post('/medicao/buscar-ultima')
        .set('Cookie', [`token=${tokenAutenticado}`])
        .send({
          dispositivoId: mockDispositivoId,
          tipo: 'umidade',
        })

      expect(resposta.status).toBe(200)
      expect(resposta.body.id).toBe('medicao-id-03') // Criada às 10:30h
      expect(resposta.body.valor).toBe(65.0)
    })

    it('deve retornar erro ou status de não encontrado (>= 400) se não existirem medições para o filtro informado', async () => {
      const resposta = await request(app)
        .post('/medicao/buscar-ultima')
        .set('Cookie', [`token=${tokenAutenticado}`])
        .send({
          dispositivoId: 'DISPOSITIVO-SEM-MEDICOES',
          tipo: 'temperatura',
        })

      expect(resposta.status).toBeGreaterThanOrEqual(400) // Geralmente retorna 404
    })
  })
})
