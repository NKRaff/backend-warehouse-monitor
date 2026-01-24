import type { CriarUsuarioController } from '@/interface/usuario/criar-usuario/criar-usuario.controller.js'
import type { RemoverUsuarioController } from '@/interface/usuario/remover-usuario/remover-usuario.controller.js'
import { Router } from 'express'

export class UsuarioRoutes {
  public readonly routes: Router

  private constructor(
    private readonly criarUsuarioController: CriarUsuarioController,
    private readonly removerUsuarioController: RemoverUsuarioController,
  ) {
    this.routes = Router()
    this.setupRoutes()
  }

  public static create(
    criarUsuarioController: CriarUsuarioController,
    removerUsuarioController: RemoverUsuarioController,
  ) {
    return new UsuarioRoutes(criarUsuarioController, removerUsuarioController)
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

    this.routes.delete('/:id', async (req, res) => {
      try {
        const result = await this.removerUsuarioController.handle({ id: req.params.id })
        res.status(200).json(result)
      } catch (error) {
        res.status(400).json(error)
      }
    })
  }
}
