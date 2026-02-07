import type { AtualizarAmbienteController } from '@/interface/ambiente/atualizar-ambientes/atualizar-ambientes.controller.js'
import type { CriarAmbienteController } from '@/interface/ambiente/criar-ambientes/criar-ambiente.controller.js'
import type { ListarAmbientesController } from '@/interface/ambiente/listar-ambiestes/listar-ambientes.controller.js'
import type { RemoverAmbienteController } from '@/interface/ambiente/remover-ambiente/remover-ambiente.controller.js'
import { Router } from 'express'
import { autenticarToken } from '../middlewares/autenticacao.middleware.js'

export class AmbienteRoutes {
  public readonly routes: Router

  private constructor(
    private readonly criarAmbienteController: CriarAmbienteController,
    private readonly listarAmbientesController: ListarAmbientesController,
    private readonly atualizarAmbienteController: AtualizarAmbienteController,
    private readonly removerAmbienteController: RemoverAmbienteController,
  ) {
    this.routes = Router()
    this.setupRoutes()
  }

  public static create(
    criarAmbienteController: CriarAmbienteController,
    listarAmbientesController: ListarAmbientesController,
    atualizarAmbienteController: AtualizarAmbienteController,
    removerAmbienteController: RemoverAmbienteController,
  ) {
    return new AmbienteRoutes(
      criarAmbienteController,
      listarAmbientesController,
      atualizarAmbienteController,
      removerAmbienteController,
    )
  }

  private setupRoutes() {
    this.routes.post('/', autenticarToken, async (req, res) => {
      try {
        const result = await this.criarAmbienteController.handle(req.body)
        res.status(201).json(result)
      } catch (error) {
        res.status(400).json(error)
      }
    })

    this.routes.get('/', autenticarToken, async (_req, res) => {
      try {
        const result = await this.listarAmbientesController.handle()
        res.status(200).json(result)
      } catch (error) {
        res.status(400).json(error)
      }
    })

    this.routes.patch('/:id', autenticarToken, async (req, res) => {
      try {
        const input = {
          id: req.params.id,
          ...req.body,
        }
        const result = await this.atualizarAmbienteController.handle(input)
        res.status(200).json(result)
      } catch (error) {
        res.status(400).json(error)
      }
    })

    this.routes.delete('/:id', autenticarToken, async (req, res) => {
      try {
        const result = await this.removerAmbienteController.handle({ id: req.params.id })
        res.status(200).json(result)
      } catch (error) {
        res.status(400).json(error)
      }
    })
  }
}
