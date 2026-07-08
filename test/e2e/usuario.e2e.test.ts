import 'dotenv/config'
import type { Express } from 'express'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { AtivarRecebimentoEmailUseCase } from '../../src/application/usuario/use-cases/ativar-recebimento-email.usecase.js'
import { AtualizarUsuarioUseCase } from '../../src/application/usuario/use-cases/atualizar-usuario.usecase.js'
import { CriarUsuarioUseCase } from '../../src/application/usuario/use-cases/criar-usuario.usecase.js'
import { DesativarRecebimentoEmailUseCase } from '../../src/application/usuario/use-cases/desativar-recebimento-email.usecase.js'
import { RemoverUsuarioUseCase } from '../../src/application/usuario/use-cases/remover-usuario.usecase.js'
import { MongooseAutenticacaoRepository } from '../../src/infra/database/autenticacao/autenticacao.repository.js'
import { MongooseORM } from '../../src/infra/database/mongoose.config.js'
import { MongooseUsuarioRepository } from '../../src/infra/database/usuario/usuario.repository.js'
import { Routes } from '../../src/infra/http/routes/routes.js'
import { ServerHTTP } from '../../src/infra/http/server.js'
import { AtualizarUsuarioController } from '../../src/interface/usuario/atualizar-usuario/atualizar-usuario.controller.js'
import { CriarUsuarioController } from '../../src/interface/usuario/criar-usuario/criar-usuario.controller.js'
import { AtivarRecebimentoEmailController } from '../../src/interface/usuario/recebimento-email/ativar-recebimento-email.controller.js'
import { DesativarRecebimentoEmailController } from '../../src/interface/usuario/recebimento-email/desativar-recebimento-email.controller.js'
import { RemoverUsuarioController } from '../../src/interface/usuario/remover-usuario/remover-usuario.controller.js'

describe('Usuário E2E Tests', () => {
  let app: Express
  let orm: MongooseORM
  let tokenAutenticado: string

  // IDs estáticos isolados para esta suíte
  const mockUsuarioAutenticadoId = '019c3508-b86e-7249-ab79-5f5d8807fd88'
  const mockAutenticacaoId = '019c3508-b86e-7249-ab79-5f5d8807fd99'

  beforeAll(async () => {
    // 1. Conexão
    orm = MongooseORM.create()
    await orm.connectDatabase()

    // 2. Setup de Dependências
    const usuarioRepo = MongooseUsuarioRepository.create()
    const autenticacaoRepo = MongooseAutenticacaoRepository.create()

    // Respeitando a ordem do construtor da classe Routes principal
    const routes = Routes.create(
      null as any, // 1. criarAmbiente
      null as any, // 2. listarAmbientes
      null as any, // 3. atualizarAmbiente
      null as any, // 4. removerAmbiente
      null as any, // 5. cadastrarDispositivo
      null as any, // 6. listarDispositivo
      null as any, // 7. atualizarDispositivo
      null as any, // 8. removerDispositivo
      null as any, // 9. buscarMedicoes
      null as any, // 10. buscarUltimaMedicao
      CriarUsuarioController.create(CriarUsuarioUseCase.create(usuarioRepo, autenticacaoRepo)),
      RemoverUsuarioController.create(RemoverUsuarioUseCase.create(usuarioRepo, autenticacaoRepo)),
      AtivarRecebimentoEmailController.create(AtivarRecebimentoEmailUseCase.create(usuarioRepo)),
      DesativarRecebimentoEmailController.create(
        DesativarRecebimentoEmailUseCase.create(usuarioRepo),
      ),
      AtualizarUsuarioController.create(AtualizarUsuarioUseCase.create(usuarioRepo)),
      null as any, // 16. login
      null as any, // 17. listarNotificacao
      null as any, // 18. marcarNotificacaoLida
    ).routes

    // 3. Servidor e Token
    app = ServerHTTP.create(routes).expressApp
    tokenAutenticado = jwt.sign({}, process.env.JWT_SECRET || 'supersecreto', {
      subject: mockUsuarioAutenticadoId,
      expiresIn: '1h',
    })
  })

  beforeEach(async () => {
    // Limpa os dados iteráveis antes de cada teste para garantir isolamento
    const db = mongoose.connection
    await db.collection('usuarios').deleteMany({})
    await db.collection('autenticacaos').deleteMany({})

    // Recria um usuário base para ser usado nos testes que exigem autenticação/existência prévia
    await db.collection('usuarios').insertOne({
      _id: mockUsuarioAutenticadoId as any,
      nome: 'Usuário Base de Testes',
      email: 'base@teste.com',
      receber_email: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    await db.collection('autenticacaos').insertOne({
      _id: mockAutenticacaoId as any,
      usuarioId: mockUsuarioAutenticadoId,
      senha: '$2b$10$/xnF.rBWp2ziVAd40ztXZOqPb2eosx/UXTTEu1VuWECinkrVJbIEq', // mock criptografado
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  })

  afterAll(async () => {
    await mongoose.connection.close()
  })

  // --- TESTES ---

  describe('POST /usuario - Cadastro de Usuário', () => {
    it('deve cadastrar um novo usuário com sucesso se o payload for válido (Caminho Feliz)', async () => {
      const payloadValido = {
        nome: 'Novo Usuário Silva',
        email: 'novo.usuario@gmail.com',
        senha: 'SenhaForte123!',
        receberEmail: true,
      }

      const resposta = await request(app).post('/usuario').send(payloadValido) // Geralmente a criação não exige token autenticado

      expect(resposta.status).toBe(201)
      expect(resposta.body).toHaveProperty('id')
      expect(typeof resposta.body.id).toBe('string')
    })

    it('deve falhar ao tentar cadastrar um usuário sem senha ou email obrigatório', async () => {
      const payloadInvalido = {
        nome: 'Usuário Incompleto',
        receberEmail: false,
      }

      const resposta = await request(app).post('/usuario').send(payloadInvalido)

      expect(resposta.status).toBeGreaterThanOrEqual(400)
    })
  })

  describe('PATCH /usuario/:id - Atualização de Usuário', () => {
    it('deve atualizar os dados de um usuário existente com sucesso (Caminho Feliz)', async () => {
      // Como a rota PATCH informada na documentação atua sobre a entidade,
      // utilizaremos a passagem pelo parâmetro de rota (padrão REST).
      const resposta = await request(app)
        .patch(`/usuario/`)
        .set('Cookie', [`token=${tokenAutenticado}`])
        .send({
          nome: 'Nome Atualizado Pelo Teste',
          receberEmail: true, // testando modificação de preferência via patch
        })

      expect(resposta.status).toBe(200)
      expect(resposta.body).toStrictEqual({ id: mockUsuarioAutenticadoId })
    })

    it('deve retornar erro ao tentar atualizar dados de um usuário inexistente', async () => {
      const idInexistente = new mongoose.Types.ObjectId().toString()

      const resposta = await request(app)
        .patch(`/usuario/${idInexistente}`)
        .set('Cookie', [`token=${tokenAutenticado}`])
        .send({ nome: 'Nome Fantasma' })

      expect(resposta.status).toBeGreaterThanOrEqual(400)
    })
  })

  describe('POST /usuario/ativar-recebimento-email - Ativar E-mail', () => {
    it('deve ativar o recebimento de e-mail com sucesso', async () => {
      const resposta = await request(app)
        .post('/usuario/ativar-recebimento-email')
        .set('Cookie', [`token=${tokenAutenticado}`])
        .send({ id: mockUsuarioAutenticadoId })

      expect(resposta.status).toBe(200)
    })
  })

  describe('POST /usuario/desativar-recebimento-email - Desativar E-mail', () => {
    it('deve desativar o recebimento de e-mail com sucesso', async () => {
      const resposta = await request(app)
        .post('/usuario/desativar-recebimento-email')
        .set('Cookie', [`token=${tokenAutenticado}`])
        .send({ id: mockUsuarioAutenticadoId })

      expect(resposta.status).toBe(200)
    })
  })

  describe('DELETE /usuario/:id - Deleção de Usuário', () => {
    it('deve deletar um usuário cadastrado e suas credenciais (Caminho Feliz)', async () => {
      const resposta = await request(app)
        .delete(`/usuario/`)
        .set('Cookie', [`token=${tokenAutenticado}`])
        .send({ id: mockUsuarioAutenticadoId })

      expect(resposta.status).toBeLessThan(400)

      // Verificação direta no banco se o registro sumiu
      const usuarioRestante = await mongoose.connection
        .collection('usuarios')
        .findOne({ id: mockUsuarioAutenticadoId })
      const autenticacaoRestante = await mongoose.connection
        .collection('autenticacaos')
        .findOne({ usuarioId: mockUsuarioAutenticadoId })

      expect(usuarioRestante).toBeNull()
      expect(autenticacaoRestante).toBeNull()
    })

    it('deve retornar erro ao tentar deletar um usuário com id inválido ou inexistente', async () => {
      const resposta = await request(app)
        .delete(`/usuario/`)
        .set('Cookie', [`token=${tokenAutenticado}`])
        .send({ id: '1234' })

      expect(resposta.status).toBeGreaterThanOrEqual(400)
    })
  })
})
