import type { CriarAmbienteController } from '@/interface/ambiente/criar-ambientes/criar-ambiente.controller.js'
import type { ListarAmbientesController } from '@/interface/ambiente/listar-ambiestes/listar-ambientes.controller.js'
import type { CadastrarDispositivoController } from '@/interface/dispositivo/cadastrar-dispositivo/cadastrar-dispositivo.controller.js'
import { Router } from 'express'
import { AmbienteRoutes } from './ambientes.route.js'
import { DispositivoRoutes } from './dispositivo.route.js'

export class Routes {
  public readonly routes: Router

  private constructor(
    private readonly criarAmbienteController: CriarAmbienteController,
    private readonly listarAmbientesController: ListarAmbientesController,
    private readonly cadastrarDispositivoController: CadastrarDispositivoController,
  ) {
    this.routes = Router()
    this.setupRoutes()
  }

  public static create(
    criarAmbienteController: CriarAmbienteController,
    listarAmbientesController: ListarAmbientesController,
    cadastrarDispositivoController: CadastrarDispositivoController,
  ) {
    return new Routes(
      criarAmbienteController,
      listarAmbientesController,
      cadastrarDispositivoController,
    )
  }

  public setupRoutes() {
    this.routes.use(
      '/ambiente',
      AmbienteRoutes.create(this.criarAmbienteController, this.listarAmbientesController).routes,
    )

    this.routes.use(
      '/dispositivo',
      DispositivoRoutes.create(this.cadastrarDispositivoController).routes,
    )
  }
}
