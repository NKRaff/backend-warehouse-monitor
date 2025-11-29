import type { CadastrarDispositivoController } from '@/interface/dispositivo/cadastrar-dispositivo/cadastrar-dispositivo.controller.js'
import { Router } from 'express'

export class DispositivoRoutes {
  public readonly routes: Router

  private constructor(
    private readonly cadastrarDispositivoController: CadastrarDispositivoController,
  ) {
    this.routes = Router()
    this.setupRoutes()
  }

  public static create(cadastrarDispositivoController: CadastrarDispositivoController) {
    return new DispositivoRoutes(cadastrarDispositivoController)
  }

  private setupRoutes() {
    this.routes.post('/', async (req, res) => {
      try {
        const result = await this.cadastrarDispositivoController.handle(req.body)
        res.status(201).json(result)
      } catch (error) {
        res.status(400).json(error)
      }
    })
  }
}
