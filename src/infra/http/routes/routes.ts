import type { AtualizarAmbienteController } from '@/interface/ambiente/atualizar-ambientes/atualizar-ambientes.controller.js'
import type { CriarAmbienteController } from '@/interface/ambiente/criar-ambientes/criar-ambiente.controller.js'
import type { ListarAmbientesController } from '@/interface/ambiente/listar-ambiestes/listar-ambientes.controller.js'
import type { RemoverAmbienteController } from '@/interface/ambiente/remover-ambiente/remover-ambiente.controller.js'
import type { LoginController } from '@/interface/autenticacao/logar/logar.controller.js'
import type { AtualizarDispositivoController } from '@/interface/dispositivo/atualizar-dispositivo/atualizar-dispositivo.controller.js'
import type { CadastrarDispositivoController } from '@/interface/dispositivo/cadastrar-dispositivo/cadastrar-dispositivo.controller.js'
import type { ListarDispositivosController } from '@/interface/dispositivo/listar-dispositivos/listar-dispositivos.controller.js'
import type { RemoverDispositivoController } from '@/interface/dispositivo/remover-dispositivo/remover-dispositivo.controller.js'
import type { BuscarMedicoesController } from '@/interface/medicao/buscar-medicoes/buscar-medicoes.controller.js'
import type { BuscarUltimaMedicaoController } from '@/interface/medicao/buscar-ultima-medicao/buscar-ultima-medicao.controller.js'
import type { CadastrarMedicaoController } from '@/interface/medicao/cadastrar-medicao/cadastrar-medicao.controller.js'
import type { ListarNotificacaoDoUsuarioController } from '@/interface/notificacao/listar-notificacao-do-usuario/listar-notificacao-do-usuario.controller.js'
import type { MarcarComoLidaController } from '@/interface/notificacao/marcar-como-lida/marcar-como-lida.controller.js'
import type { CriarUsuarioController } from '@/interface/usuario/criar-usuario/criar-usuario.controller.js'
import type { AtivarRecebimentoEmailController } from '@/interface/usuario/recebimento-email/ativar-recebimento-email.controller.js'
import type { DesativarRecebimentoEmailController } from '@/interface/usuario/recebimento-email/desativar-recebimento-email.controller.js'
import type { RemoverUsuarioController } from '@/interface/usuario/remover-usuario/remover-usuario.controller.js'
import { Router } from 'express'
import { AmbienteRoutes } from './ambientes.route.js'
import { DispositivoRoutes } from './dispositivo.route.js'
import { LoginRoutes } from './login.route.js'
import { MedicaoRoutes } from './medicao.route.js'
import { NotificaoRoutes } from './notificacao.route.js'
import { UsuarioRoutes } from './usuario.route.js'

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
    private readonly buscarMedicoesController: BuscarMedicoesController,
    private readonly buscarUltimaMedicaoController: BuscarUltimaMedicaoController,

    private readonly criarUsuarioController: CriarUsuarioController,
    private readonly removerUsuarioController: RemoverUsuarioController,
    private readonly ativarRecebimentoEmailController: AtivarRecebimentoEmailController,
    private readonly desativarRecebimentoEmailController: DesativarRecebimentoEmailController,

    private readonly loginController: LoginController,

    private readonly listarNotificacaoDoUsuarioController: ListarNotificacaoDoUsuarioController,
    private readonly marcarComoLidaController: MarcarComoLidaController,
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
    buscarMedicoesController: BuscarMedicoesController,
    buscarUltimaMedicaoController: BuscarUltimaMedicaoController,

    criarUsuarioController: CriarUsuarioController,
    removerUsuarioController: RemoverUsuarioController,
    ativarRecebimentoEmailController: AtivarRecebimentoEmailController,
    desativarRecebimentoEmailController: DesativarRecebimentoEmailController,

    loginController: LoginController,

    listarNotificacaoDoUsuarioController: ListarNotificacaoDoUsuarioController,
    marcarComoLidaController: MarcarComoLidaController,
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
      buscarMedicoesController,
      buscarUltimaMedicaoController,

      criarUsuarioController,
      removerUsuarioController,
      ativarRecebimentoEmailController,
      desativarRecebimentoEmailController,

      loginController,

      listarNotificacaoDoUsuarioController,
      marcarComoLidaController,
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

    this.routes.use(
      '/medicao',
      MedicaoRoutes.create(
        this.cadastrarMedicaoController,
        this.buscarMedicoesController,
        this.buscarUltimaMedicaoController,
      ).routes,
    )

    this.routes.use(
      '/usuario',
      UsuarioRoutes.create(
        this.criarUsuarioController,
        this.removerUsuarioController,
        this.ativarRecebimentoEmailController,
        this.desativarRecebimentoEmailController,
      ).routes,
    )

    this.routes.use('/autenticacao', LoginRoutes.create(this.loginController).routes)

    this.routes.use(
      '/notificacao',
      NotificaoRoutes.create(
        this.listarNotificacaoDoUsuarioController,
        this.marcarComoLidaController,
      ).routes,
    )
  }
}
