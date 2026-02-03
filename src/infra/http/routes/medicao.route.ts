import type { BuscarMedicoesController } from '@/interface/medicao/buscar-medicoes/buscar-medicoes.controller.js'
import type { BuscarUltimaMedicaoController } from '@/interface/medicao/buscar-ultima-medicao/buscar-ultima-medicao.controller.js'
import { Router } from 'express'
import { autenticarToken } from '../middlewares/autenticacao.middleware.js'

export class MedicaoRoutes {
  public readonly routes: Router

  private constructor(
    private readonly buscarMedicoesController: BuscarMedicoesController,
    private readonly buscarUltimaMedicaoController: BuscarUltimaMedicaoController,
  ) {
    this.routes = Router()
    this.setupRoutes()
  }

  public static create(
    buscarMedicoesController: BuscarMedicoesController,
    buscarUltimaMedicaoController: BuscarUltimaMedicaoController,
  ) {
    return new MedicaoRoutes(buscarMedicoesController, buscarUltimaMedicaoController)
  }

  private setupRoutes() {
    this.routes.post('/buscar', autenticarToken, async (req, res) => {
      try {
        const result = await this.buscarMedicoesController.handle(req.body)
        res.status(200).json(result)
      } catch (error) {
        res.status(400).json(error)
      }
    })

    this.routes.post('/buscar-ultima', autenticarToken, async (req, res) => {
      try {
        const result = await this.buscarUltimaMedicaoController.handle(req.body)
        res.status(200).json(result)
      } catch (error) {
        res.status(400).json(error)
      }
    })
  }
}
