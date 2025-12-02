import type { AtualizarAmbienteController } from '@/interface/ambiente/atualizar-ambientes/atualizar-ambientes.controller.js'
import type { CriarAmbienteController } from '@/interface/ambiente/criar-ambientes/criar-ambiente.controller.js'
import type { ListarAmbientesController } from '@/interface/ambiente/listar-ambiestes/listar-ambientes.controller.js'
import type { RemoverAmbienteController } from '@/interface/ambiente/remover-ambiente/remover-ambiente.controller.js'
import type { AtualizarDispositivoController } from '@/interface/dispositivo/atualizar-dispositivo/atualizar-dispositivo.controller.js'
import type { CadastrarDispositivoController } from '@/interface/dispositivo/cadastrar-dispositivo/cadastrar-dispositivo.controller.js'
import type { ListarDispositivosController } from '@/interface/dispositivo/listar-dispositivos/listar-dispositivos.controller.js'
import type { RemoverDispositivoController } from '@/interface/dispositivo/remover-dispositivo/remover-dispositivo.controller.js'
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
    private readonly atualizarAmbienteController: AtualizarAmbienteController,
    private readonly removerAmbienteController: RemoverAmbienteController,

    private readonly cadastrarDispositivoController: CadastrarDispositivoController,
    private readonly listarDispositivosController: ListarDispositivosController,
    private readonly atualizarDispositivoController: AtualizarDispositivoController,
    private readonly removerDispositivoController: RemoverDispositivoController,

    private readonly cadastrarMedicaoController: CadastrarMedicaoController,
  ) {
    this.routes = Router()
    this.setupRoutes()
  }

  public static create(
    criarAmbienteController: CriarAmbienteController,
    listarAmbientesController: ListarAmbientesController,
    atualizarAmbienteController: AtualizarAmbienteController,
    removerAmbienteController: RemoverAmbienteController,

    cadastrarDispositivoController: CadastrarDispositivoController,
    listarDispositivosController: ListarDispositivosController,
    atualizarDispositivoController: AtualizarDispositivoController,
    removerDispositivoController: RemoverDispositivoController,

    cadastrarMedicaoController: CadastrarMedicaoController,
  ) {
    return new Routes(
      criarAmbienteController,
      listarAmbientesController,
      atualizarAmbienteController,
      removerAmbienteController,

      cadastrarDispositivoController,
      listarDispositivosController,
      atualizarDispositivoController,
      removerDispositivoController,

      cadastrarMedicaoController,
    )
  }

  public setupRoutes() {
    this.routes.use(
      '/ambiente',
      AmbienteRoutes.create(
        this.criarAmbienteController,
        this.listarAmbientesController,
        this.atualizarAmbienteController,
        this.removerAmbienteController,
      ).routes,
    )

    this.routes.use(
      '/dispositivo',
      DispositivoRoutes.create(
        this.cadastrarDispositivoController,
        this.listarDispositivosController,
        this.atualizarDispositivoController,
        this.removerDispositivoController,
      ).routes,
    )

    this.routes.use('/medicao', MedicaoRoutes.create(this.cadastrarMedicaoController).routes)
  }
}
