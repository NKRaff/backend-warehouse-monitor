import type { CriarAmbienteController } from '@/interface/ambiente/criar-ambientes/criar-ambiente.controller.js'
import type { ListarAmbientesController } from '@/interface/ambiente/listar-ambiestes/listar-ambientes.controller.js'
import { Router } from 'express'

export class AmbienteRoutes {
  public readonly routes: Router

  private constructor(
    private readonly criarAmbienteController: CriarAmbienteController,
    private readonly listarAmbientesController: ListarAmbientesController,
  ) {
    this.routes = Router()
    this.setupRoutes()
  }

  public static create(
    criarAmbienteController: CriarAmbienteController,
    listarAmbientesController: ListarAmbientesController,
  ) {
    return new AmbienteRoutes(criarAmbienteController, listarAmbientesController)
  }

  private setupRoutes() {
    this.routes.post('/', async (req, res) => {
      try {
        const result = await this.criarAmbienteController.handle(req.body)
        res.status(201).json(result)
      } catch (error) {
        res.status(400).json(error)
      }
    })

    this.routes.get('', async (_req, res) => {
      try {
        const result = await this.listarAmbientesController.handle()
        res.status(200).json(result)
      } catch (error) {
        res.status(400).json(error)
      }
    })
  }
}
