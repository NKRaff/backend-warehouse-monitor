import { Router } from 'express'
import type { ListarNotificacaoDoUsuarioController } from '../../../interface/notificacao/listar-notificacao-do-usuario/listar-notificacao-do-usuario.controller.js'
import type { MarcarComoLidaController } from '../../../interface/notificacao/marcar-como-lida/marcar-como-lida.controller.js'
import { autenticarToken } from '../middlewares/autenticacao.middleware.js'

export class NotificaoRoutes {
  public readonly routes: Router

  private constructor(
    private readonly listarNotificacaoDoUsuarioController: ListarNotificacaoDoUsuarioController,
    private readonly marcarComoLidaController: MarcarComoLidaController,
  ) {
    this.routes = Router()
    this.setupRoutes()
  }

  public static create(
    listarNotificacaoDoUsuarioController: ListarNotificacaoDoUsuarioController,
    marcarComoLidaController: MarcarComoLidaController,
  ) {
    return new NotificaoRoutes(listarNotificacaoDoUsuarioController, marcarComoLidaController)
  }

  private setupRoutes() {
    this.routes.get('/:usuarioId', autenticarToken, async (req, res) => {
      try {
        const input = {
          usuarioId: req.params.usuarioId,
        }
        const result = await this.listarNotificacaoDoUsuarioController.handle(input)
        res.status(200).json(result)
      } catch (error) {
        res.status(400).json(error)
      }
    })

    this.routes.post('/', autenticarToken, async (req, res) => {
      try {
        const result = await this.marcarComoLidaController.handle(req.body)
        res.status(200).json(result)
      } catch (error) {
        res.status(400).json(error)
      }
    })
  }
}
