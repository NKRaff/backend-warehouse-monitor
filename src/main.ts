import 'dotenv/config'
import { AtualizarAmbienteUseCase } from './application/ambiente/use-cases/atualizar-ambiente.usecase.js'
import { CriarAmbienteUseCase } from './application/ambiente/use-cases/criar-ambiente.usecase.js'
import { ListarAmbientesUseCase } from './application/ambiente/use-cases/listar-ambientes.usecase.js'
import { RemoverAmbienteUseCase } from './application/ambiente/use-cases/remover-ambiente.usecase.js'
import { LogarUseCase } from './application/autenticacao/use-cases/logar.usecase.js'
import { AtualizarDispositivoUseCase } from './application/dispositivo/use-cases/atualizar-dispositivo.usecase.js'
import { CadastrarDispositivoUseCase } from './application/dispositivo/use-cases/cadastrar-dispositivo.usecase.js'
import { ListarDispositivosUseCase } from './application/dispositivo/use-cases/listar-dispositivos.usecase.js'
import { RemoverDispositivoUseCase } from './application/dispositivo/use-cases/remover-dispositivo.usecase.js'
import { BuscarMedicaoUseCase } from './application/medicao/use-cases/buscar-medicoes.usecase.js'
import { BuscarUltimaMedicaoUseCase } from './application/medicao/use-cases/buscar-ultima-medicao.usecase.js'
import { CadastrarMedicaoUseCase } from './application/medicao/use-cases/cadastrar-medicao.usecase.js'
import { ListarNotificacaoDoUsuarioUseCase } from './application/notificacao/use-cases/listar-notificacao-do-usuario.usecase.js'
import { MarcarComoLidaUseCase } from './application/notificacao/use-cases/marcar-como-lida.usecase.js'
import { AtivarRecebimentoEmailUseCase } from './application/usuario/use-cases/ativar-recebimento-email.usecase.js'
import { AtualizarUsuarioUseCase } from './application/usuario/use-cases/atualizar-usuario.usecase.js'
import { CriarUsuarioUseCase } from './application/usuario/use-cases/criar-usuario.usecase.js'
import { DesativarRecebimentoEmailUseCase } from './application/usuario/use-cases/desativar-recebimento-email.usecase.js'
import { RemoverUsuarioUseCase } from './application/usuario/use-cases/remover-usuario.usecase.js'
import { MongooseAlertaRepository } from './infra/database/alerta/alerta.repository.js'
import { MongooseAmbienteRepository } from './infra/database/ambiente/ambiente.repository.js'
import { MongooseAutenticacaoRepository } from './infra/database/autenticacao/autenticacao.repository.js'
import { MongooseDispositivoRepository } from './infra/database/dispositivo/dispositivo.repository.js'
import { MongooseMedicaoRepository } from './infra/database/medicao/medicao.repository.js'
import { MongooseORM } from './infra/database/mongoose.config.js'
import { MongooseNotificacaoRepository } from './infra/database/notificacao/notificacao.repository.js'
import { MongooseUsuarioRepository } from './infra/database/usuario/usuario.repository.js'
import { Routes } from './infra/http/routes/routes.js'
import { ServerHTTP } from './infra/http/server.js'
import { ClientMQTT } from './infra/mqtt/client.js'
import { MqttTopicSubscriber } from './infra/mqtt/topic-subscriber.js'
import { Nodemailer } from './infra/smtp/nodemailer/client.mailer.js'
import { AtualizarAmbienteController } from './interface/ambiente/atualizar-ambientes/atualizar-ambientes.controller.js'
import { CriarAmbienteController } from './interface/ambiente/criar-ambientes/criar-ambiente.controller.js'
import { ListarAmbientesController } from './interface/ambiente/listar-ambiestes/listar-ambientes.controller.js'
import { RemoverAmbienteController } from './interface/ambiente/remover-ambiente/remover-ambiente.controller.js'
import { LoginController } from './interface/autenticacao/logar/logar.controller.js'
import { AtualizarDispositivoController } from './interface/dispositivo/atualizar-dispositivo/atualizar-dispositivo.controller.js'
import { CadastrarDispositivoController } from './interface/dispositivo/cadastrar-dispositivo/cadastrar-dispositivo.controller.js'
import { ListarDispositivosController } from './interface/dispositivo/listar-dispositivos/listar-dispositivos.controller.js'
import { RemoverDispositivoController } from './interface/dispositivo/remover-dispositivo/remover-dispositivo.controller.js'
import { BuscarMedicoesController } from './interface/medicao/buscar-medicoes/buscar-medicoes.controller.js'
import { BuscarUltimaMedicaoController } from './interface/medicao/buscar-ultima-medicao/buscar-ultima-medicao.controller.js'
import { CadastrarMedicaoController } from './interface/medicao/cadastrar-medicao/cadastrar-medicao.controller.js'
import { ListarNotificacaoDoUsuarioController } from './interface/notificacao/listar-notificacao-do-usuario/listar-notificacao-do-usuario.controller.js'
import { MarcarComoLidaController } from './interface/notificacao/marcar-como-lida/marcar-como-lida.controller.js'
import { AtualizarUsuarioController } from './interface/usuario/atualizar-usuario/atualizar-usuario.controller.js'
import { CriarUsuarioController } from './interface/usuario/criar-usuario/criar-usuario.controller.js'
import { AtivarRecebimentoEmailController } from './interface/usuario/recebimento-email/ativar-recebimento-email.controller.js'
import { DesativarRecebimentoEmailController } from './interface/usuario/recebimento-email/desativar-recebimento-email.controller.js'
import { RemoverUsuarioController } from './interface/usuario/remover-usuario/remover-usuario.controller.js'

async function main() {
  // Conectar MongoDB
  const orm = MongooseORM.create()
  await orm.connectDatabase()

  // Conecta no Broker MQTT
  const clientMQTT = ClientMQTT.create()
  const topicSubscriber = MqttTopicSubscriber.create(clientMQTT)

  // Cria Transporter Mailer SMTP
  const mailer = Nodemailer.create()

  // Instanciar repositorios
  const ambienteRepo = MongooseAmbienteRepository.create()
  const dispositivoRepo = MongooseDispositivoRepository.create()
  const medicaoRepo = MongooseMedicaoRepository.create()
  const usuarioRepo = MongooseUsuarioRepository.create()
  const autenticacaoRepo = MongooseAutenticacaoRepository.create()
  const alertaRepo = MongooseAlertaRepository.create()
  const notificacaoRepo = MongooseNotificacaoRepository.create()

  // Instanciar use cases
  const criarAmbienteUseCase = CriarAmbienteUseCase.create(ambienteRepo)
  const listarAmbientesUseCase = ListarAmbientesUseCase.create(ambienteRepo)
  const atualizarAmbienteUseCase = AtualizarAmbienteUseCase.create(ambienteRepo)
  const removerAmbienteUseCase = RemoverAmbienteUseCase.create(ambienteRepo, dispositivoRepo)

  const cadastrarDispositivoUseCase = CadastrarDispositivoUseCase.create(
    dispositivoRepo,
    topicSubscriber,
  )
  const listarDispositivosUseCase = ListarDispositivosUseCase.create(dispositivoRepo)
  const atualizarDispositivoUseCase = AtualizarDispositivoUseCase.create(dispositivoRepo)
  const removerDispositivoUseCase = RemoverDispositivoUseCase.create(dispositivoRepo)

  const cadastrarMedicaoUseCase = CadastrarMedicaoUseCase.create(
    medicaoRepo,
    dispositivoRepo,
    ambienteRepo,
    alertaRepo,
    usuarioRepo,
    notificacaoRepo,
    mailer,
  )
  const buscarMedicoesUseCase = BuscarMedicaoUseCase.create(medicaoRepo)
  const buscarUltimaMedicaoUseCase = BuscarUltimaMedicaoUseCase.create(medicaoRepo)

  const criarUsuarioUseCase = CriarUsuarioUseCase.create(usuarioRepo, autenticacaoRepo)
  const removerUsuarioUseCase = RemoverUsuarioUseCase.create(usuarioRepo, autenticacaoRepo)
  const ativarRecebimentoEmailUseCase = AtivarRecebimentoEmailUseCase.create(usuarioRepo)
  const desativarRecebimentoEmailUseCase = DesativarRecebimentoEmailUseCase.create(usuarioRepo)
  const atualizarUsuarioUseCase = AtualizarUsuarioUseCase.create(usuarioRepo)

  const loginUseCase = LogarUseCase.create(usuarioRepo, autenticacaoRepo)

  const listaNotificacaoDoUsuarioUseCase = ListarNotificacaoDoUsuarioUseCase.create(
    alertaRepo,
    notificacaoRepo,
  )
  const marcarComoLidaUseCase = MarcarComoLidaUseCase.create(notificacaoRepo)

  // Instanciar controllers
  const criarAmbienteController = CriarAmbienteController.create(criarAmbienteUseCase)
  const listarAmbientesController = ListarAmbientesController.create(listarAmbientesUseCase)
  const atualizarAmbienteController = AtualizarAmbienteController.create(atualizarAmbienteUseCase)
  const removerAmbienteController = RemoverAmbienteController.create(removerAmbienteUseCase)

  const cadastrarDispositivoController = CadastrarDispositivoController.create(
    cadastrarDispositivoUseCase,
  )
  const listarDispositivoController = ListarDispositivosController.create(listarDispositivosUseCase)
  const atualizarDispositivoController = AtualizarDispositivoController.create(
    atualizarDispositivoUseCase,
  )
  const removerDispositivoController =
    RemoverDispositivoController.create(removerDispositivoUseCase)

  const cadastrarMedicaoController = CadastrarMedicaoController.create(cadastrarMedicaoUseCase)
  const buscarMedicoesController = BuscarMedicoesController.create(buscarMedicoesUseCase)
  const buscarUltimaMedicaoController = BuscarUltimaMedicaoController.create(
    buscarUltimaMedicaoUseCase,
  )

  const criarUsuarioController = CriarUsuarioController.create(criarUsuarioUseCase)
  const removerUsuarioController = RemoverUsuarioController.create(removerUsuarioUseCase)
  const ativarRecebimentoEmailController = AtivarRecebimentoEmailController.create(
    ativarRecebimentoEmailUseCase,
  )
  const desativarRecebimentoEmailController = DesativarRecebimentoEmailController.create(
    desativarRecebimentoEmailUseCase,
  )
  const atualizarUsuarioController = AtualizarUsuarioController.create(atualizarUsuarioUseCase)

  const loginController = LoginController.create(loginUseCase)

  const listarNotificacaoDoUsuarioController = ListarNotificacaoDoUsuarioController.create(
    listaNotificacaoDoUsuarioUseCase,
  )
  const marcarComoLidaController = MarcarComoLidaController.create(marcarComoLidaUseCase)

  // Instanciar as rotas
  const routes = Routes.create(
    criarAmbienteController,
    listarAmbientesController,
    atualizarAmbienteController,
    removerAmbienteController,

    cadastrarDispositivoController,
    listarDispositivoController,
    atualizarDispositivoController,
    removerDispositivoController,

    buscarMedicoesController,
    buscarUltimaMedicaoController,

    criarUsuarioController,
    removerUsuarioController,
    ativarRecebimentoEmailController,
    desativarRecebimentoEmailController,
    atualizarUsuarioController,

    loginController,

    listarNotificacaoDoUsuarioController,
    marcarComoLidaController,
  ).routes

  clientMQTT.onMessage((msg) => cadastrarMedicaoController.handle(msg))

  const dispositivos = await dispositivoRepo.findAll()
  for (const dispositivo of dispositivos) {
    if (dispositivo.ambienteId) await topicSubscriber.dispositivoSubscribe(dispositivo.id)
  }

  // Conecta no Servidor
  const server = ServerHTTP.create(routes)
  server.start()
}

main()
