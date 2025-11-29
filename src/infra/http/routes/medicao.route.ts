import type { CadastrarMedicaoController } from '@/interface/medicao/cadastrar-medicao/cadastrar-medicao.controller.js'
import { Router } from 'express'

export class MedicaoRoutes {
  public readonly routes: Router

  private constructor(private readonly cadastrarMedicaoController: CadastrarMedicaoController) {
    this.routes = Router()
    this.setupRoutes()
  }

  public static create(cadastrarMedicaoController: CadastrarMedicaoController) {
    return new MedicaoRoutes(cadastrarMedicaoController)
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
  }
}
