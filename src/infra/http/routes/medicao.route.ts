import type { BuscarMedicoesController } from '@/interface/medicao/buscar-medicoes/buscar-medicoes.controller.js'
import type { CadastrarMedicaoController } from '@/interface/medicao/cadastrar-medicao/cadastrar-medicao.controller.js'
import { Router } from 'express'

export class MedicaoRoutes {
  public readonly routes: Router

  private constructor(
    private readonly cadastrarMedicaoController: CadastrarMedicaoController,
    private readonly buscarMedicoesController: BuscarMedicoesController,
  ) {
    this.routes = Router()
    this.setupRoutes()
  }

  public static create(
    cadastrarMedicaoController: CadastrarMedicaoController,
    buscarMedicoesController: BuscarMedicoesController,
  ) {
    return new MedicaoRoutes(cadastrarMedicaoController, buscarMedicoesController)
  }

  private setupRoutes() {
    this.routes.post('/', async (req, res) => {
      try {
        const result = await this.cadastrarMedicaoController.handle(req.body)
        res.status(201).json(result)
      } catch (error) {
        res.status(400).json(error)
      }
    })

    this.routes.post('/buscar', async (req, res) => {
      try {
        const result = await this.buscarMedicoesController.handle(req.body)
        res.status(200).json(result)
      } catch (error) {
        res.status(400).json(error)
      }
    })
  }
}
