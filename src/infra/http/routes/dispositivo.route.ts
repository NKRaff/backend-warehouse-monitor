import type { CadastrarDispositivoController } from '@/interface/dispositivo/cadastrar-dispositivo/cadastrar-dispositivo.controller.js'
import type { ListarDispositivosController } from '@/interface/dispositivo/listar-dispositivos/listar-dispositivos.controller.js'
import { Router } from 'express'

export class DispositivoRoutes {
  public readonly routes: Router

  private constructor(
    private readonly cadastrarDispositivoController: CadastrarDispositivoController,
    private readonly listarDispositivoController: ListarDispositivosController,
  ) {
    this.routes = Router()
    this.setupRoutes()
  }

  public static create(
    cadastrarDispositivoController: CadastrarDispositivoController,
    listarDispositivoController: ListarDispositivosController,
  ) {
    return new DispositivoRoutes(cadastrarDispositivoController, listarDispositivoController)
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

    this.routes.get('/', async (_req, res) => {
      try {
        const result = await this.listarDispositivoController.handle()
        res.status(200).json(result)
      } catch (error) {
        res.status(400).json(error)
      }
    })
  }
}
