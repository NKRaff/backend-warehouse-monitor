import type { CriarAmbienteController } from '@/interface/ambiente/criar-ambientes/criar-ambiente.controller.js'
import type { ListarAmbientesController } from '@/interface/ambiente/listar-ambiestes/listar-ambientes.controller.js'
import type { CadastrarDispositivoController } from '@/interface/dispositivo/cadastrar-dispositivo/cadastrar-dispositivo.controller.js'
import type { CadastrarMedicaoController } from '@/interface/medicao/cadastrar-medicao/cadastrar-medicao.controller.js'
import { Router } from 'express'
import { AmbienteRoutes } from './ambientes.route.js'
import { DispositivoRoutes } from './dispositivo.route.js'
import { MedicaoRoutes } from './medicao.route.js'

export class Routes {
  public readonly routes: Router

  private constructor(
    private readonly criarAmbienteController: CriarAmbienteController,
    private readonly listarAmbientesController: ListarAmbientesController,
    private readonly cadastrarDispositivoController: CadastrarDispositivoController,
    private readonly cadastrarMedicaoController: CadastrarMedicaoController,
  ) {
    this.routes = Router()
    this.setupRoutes()
  }

  public static create(
    criarAmbienteController: CriarAmbienteController,
    listarAmbientesController: ListarAmbientesController,
    cadastrarDispositivoController: CadastrarDispositivoController,
    cadastrarMedicaoController: CadastrarMedicaoController,
  ) {
    return new Routes(
      criarAmbienteController,
      listarAmbientesController,
      cadastrarDispositivoController,
      cadastrarMedicaoController,
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

    this.routes.use('/medicao', MedicaoRoutes.create(this.cadastrarMedicaoController).routes)
  }
}
