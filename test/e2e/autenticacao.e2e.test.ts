import { hash } from 'bcrypt'
import 'dotenv/config'
import type { Express } from 'express'
import mongoose from 'mongoose'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { LogarUseCase } from '../../src/application/autenticacao/use-cases/logar.usecase.js'
import { MongooseAutenticacaoRepository } from '../../src/infra/database/autenticacao/autenticacao.repository.js'
import { MongooseORM } from '../../src/infra/database/mongoose.config.js'
import { MongooseUsuarioRepository } from '../../src/infra/database/usuario/usuario.repository.js'
import { Routes } from '../../src/infra/http/routes/routes.js'
import { ServerHTTP } from '../../src/infra/http/server.js'
import { LoginController } from '../../src/interface/autenticacao/logar/logar.controller.js'

describe('Autenticação E2E Tests', () => {
  let app: Express
  let orm: MongooseORM

  const mockUsuarioId = '019c3500-405e-762b-9906-f89bc4175a99'
  const mockAuthId = '019c3500-405e-762b-9906-f89bc4175a88'

  const mockEmail = 'usuario.teste@discente.ifpe.edu.br'
  // Texto plano usado no payload do teste. O hash abaixo deve corresponder a esta senha.
  const mockSenhaPlana = 'SenhaSegura123'
  let mockSenhaHash: string

  beforeAll(async () => {
    // 1. Conexão com o Banco
    orm = MongooseORM.create()
    await orm.connectDatabase()

    // 2. Setup de Dependências da Autenticação
    const usuarioRepo = MongooseUsuarioRepository.create()
    const autenticacaoRepo = MongooseAutenticacaoRepository.create()

    const routes = Routes.create(
      null as any, // 1. criarAmbiente
      null as any, // 2. listarAmbientes
      null as any, // 3. atualizarAmbiente
      null as any, // 4. removerAmbiente
      null as any, // 5. cadastrarDispositivo
      null as any, // 6. listarDispositivos
      null as any, // 7. atualizarDispositivo
      null as any, // 8. removerDispositivo
      null as any, // 9. buscarMedicoes
      null as any, // 10. buscarUltimaMedicao
      null as any, // 11. criarUsuario
      null as any, // 12. removerUsuario
      null as any, // 13. ativarRecebimentoEmail
      null as any, // 14. desativarRecebimentoEmail
      null as any, // 15. atualizarUsuario
      LoginController.create(LogarUseCase.create(usuarioRepo, autenticacaoRepo)), // 16. login 🌟
      null as any, // 17. listarNotificacao
      null as any, // 18. marcarNotificacaoLida
    ).routes

    // 3. Inicialização do Servidor
    app = ServerHTTP.create(routes).expressApp

    mockSenhaHash = await hash(mockSenhaPlana, Number(process.env.BCRYPT_SALT))

    // 4. Inserção do Usuário de Teste no Banco
    const db = mongoose.connection

    await db.collection('usuarios').deleteMany({})
    await db.collection('autenticacaos').deleteMany({})

    await db.collection('usuarios').insertOne({
      _id: mockUsuarioId as any,
      nome: 'Usuario Teste Login',
      email: mockEmail,
      receber_email: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    await db.collection('autenticacaos').insertOne({
      _id: mockAuthId as any,
      usuarioId: mockUsuarioId,
      senha: mockSenhaHash,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  })

  afterAll(async () => {
    const db = mongoose.connection
    await db.collection('usuarios').deleteMany({ id: mockUsuarioId })
    await db.collection('autenticacaos').deleteMany({ id: mockAuthId })
    await db.close()
  })

  // --- SUÍTE DE TESTES ---

  describe('POST /autenticacao - Login de Usuário', () => {
    it('deve autenticar com sucesso se as credenciais forem válidas (Caminho Feliz)', async () => {
      const payloadValido = {
        email: mockEmail,
        senha: mockSenhaPlana,
      }

      const resposta = await request(app).post('/autenticacao').send(payloadValido)

      expect(resposta.status).toBe(200)
      expect(resposta.body).toHaveProperty('id')
      expect(typeof resposta.body.id).toBe('string')
    })

    it('deve falhar ao tentar logar com uma senha incorreta', async () => {
      const payloadSenhaIncorreta = {
        email: mockEmail,
        senha: 'SenhaErrada123',
      }

      const resposta = await request(app).post('/autenticacao').send(payloadSenhaIncorreta)

      expect(resposta.status).toBeGreaterThanOrEqual(400) // Geralmente 401 (Unauthorized) ou 400
    })

    it('deve falhar ao tentar logar com um e-mail não cadastrado', async () => {
      const payloadEmailInexistente = {
        email: 'naoexistente@edu.br',
        senha: mockSenhaPlana,
      }

      const resposta = await request(app).post('/autenticacao').send(payloadEmailInexistente)

      expect(resposta.status).toBeGreaterThanOrEqual(400)
    })

    it('deve falhar por validação ao omitir o campo "email"', async () => {
      const payloadInvalido = {
        senha: mockSenhaPlana,
      }

      const resposta = await request(app).post('/autenticacao').send(payloadInvalido)

      expect(resposta.status).toBeGreaterThanOrEqual(400)
    })
  })
})
