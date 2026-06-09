import { Router } from 'express'
import type { AtualizarUsuarioController } from '../../../interface/usuario/atualizar-usuario/atualizar-usuario.controller.js'
import type { CriarUsuarioController } from '../../../interface/usuario/criar-usuario/criar-usuario.controller.js'
import type { AtivarRecebimentoEmailController } from '../../../interface/usuario/recebimento-email/ativar-recebimento-email.controller.js'
import type { DesativarRecebimentoEmailController } from '../../../interface/usuario/recebimento-email/desativar-recebimento-email.controller.js'
import type { RemoverUsuarioController } from '../../../interface/usuario/remover-usuario/remover-usuario.controller.js'
import { autenticarToken } from '../middlewares/autenticacao.middleware.js'

export class UsuarioRoutes {
  public readonly routes: Router

  private constructor(
    private readonly criarUsuarioController: CriarUsuarioController,
    private readonly removerUsuarioController: RemoverUsuarioController,
    private readonly ativarRecebimentoEmailController: AtivarRecebimentoEmailController,
    private readonly desativarRecebimentoEmailController: DesativarRecebimentoEmailController,
    private readonly atualizarUsuarioController: AtualizarUsuarioController,
  ) {
    this.routes = Router()
    this.setupRoutes()
  }

  public static create(
    criarUsuarioController: CriarUsuarioController,
    removerUsuarioController: RemoverUsuarioController,
    ativarRecebimentoEmailController: AtivarRecebimentoEmailController,
    desativarRecebimentoEmailController: DesativarRecebimentoEmailController,
    atualizarUsuarioController: AtualizarUsuarioController,
  ) {
    return new UsuarioRoutes(
      criarUsuarioController,
      removerUsuarioController,
      ativarRecebimentoEmailController,
      desativarRecebimentoEmailController,
      atualizarUsuarioController,
    )
  }

  private setupRoutes() {
    this.routes.post('/', async (req, res) => {
      try {
        const result = await this.criarUsuarioController.handle(req.body)
        res.status(201).json(result)
      } catch (error) {
        res.status(400).json(error)
      }
    })

    this.routes.delete('/', autenticarToken, async (req, res) => {
      try {
        const result = await this.removerUsuarioController.handle(req.body)
        res.status(200).json(result)
      } catch (error) {
        res.status(400).json(error)
      }
    })

    this.routes.patch('/', autenticarToken, async (req, res) => {
      try {
        const result = await this.atualizarUsuarioController.handle({
          id: req.usuarioId,
          ...req.body,
        })
        res.status(200).json(result)
      } catch (error) {
        res.status(400).json(error)
      }
    })

    this.routes.post('/ativar-recebimento-email', autenticarToken, async (req, res) => {
      try {
        const result = await this.ativarRecebimentoEmailController.handle(req.body)
        res.status(200).json(result)
      } catch (error) {
        res.status(400).json(error)
      }
    })

    this.routes.post('/desativar-recebimento-email', autenticarToken, async (req, res) => {
      try {
        const result = await this.desativarRecebimentoEmailController.handle(req.body)
        res.status(200).json(result)
      } catch (error) {
        res.status(400).json(error)
      }
    })
  }
}
