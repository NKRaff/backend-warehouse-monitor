import 'dotenv/config'
import { AtualizarAmbienteUseCase } from './application/ambiente/use-cases/atualizar-ambiente.usecase.js'
import { CriarAmbienteUseCase } from './application/ambiente/use-cases/criar-ambiente.usecase.js'
import { ListarAmbientesUseCase } from './application/ambiente/use-cases/listar-ambientes.usecase.js'
import { RemoverAmbienteUseCase } from './application/ambiente/use-cases/remover-ambiente.usecase.js'
import { CadastrarDispositivoUseCase } from './application/dispositivo/use-cases/cadastrar-dispositivo.usecase.js'
import { ListarDispositivosUseCase } from './application/dispositivo/use-cases/listar-dispositivos.usecase.js'
import { CadastrarMedicaoUseCase } from './application/medicao/use-cases/cadastrar-medicao.usecase.js'
import { MongooseAmbienteRepository } from './infra/database/ambiente/ambiente.repository.js'
import { MongooseDispositivoRepository } from './infra/database/dispositivo/dispositivo.repository.js'
import { MongooseMedicaoRepository } from './infra/database/medicao/medicao.repository.js'
import { MongooseORM } from './infra/database/mongoose.config.js'
import { Routes } from './infra/http/routes/routes.js'
import { ServerHTTP } from './infra/http/server.js'
import { ClientMQTT } from './infra/mqtt/client.js'
import { AtualizarAmbienteController } from './interface/ambiente/atualizar-ambientes/atualizar-ambientes.controller.js'
import { CriarAmbienteController } from './interface/ambiente/criar-ambientes/criar-ambiente.controller.js'
import { ListarAmbientesController } from './interface/ambiente/listar-ambiestes/listar-ambientes.controller.js'
import { RemoverAmbienteController } from './interface/ambiente/remover-ambiente/remover-ambiente.controller.js'
import { CadastrarDispositivoController } from './interface/dispositivo/cadastrar-dispositivo/cadastrar-dispositivo.controller.js'
import { ListarDispositivosController } from './interface/dispositivo/listar-dispositivos/listar-dispositivos.controller.js'
import { CadastrarMedicaoController } from './interface/medicao/cadastrar-medicao/cadastrar-medicao.controller.js'

async function main() {
  // Conectar MongoDB
  const orm = MongooseORM.create()
  await orm.connectDatabase()

  // Instanciar repositorios
  const ambienteRepo = MongooseAmbienteRepository.create()
  const dispositivoRepo = MongooseDispositivoRepository.create()
  const medicaoRepo = MongooseMedicaoRepository.create()

  // Instanciar use cases
  const criarAmbienteUseCase = CriarAmbienteUseCase.create(ambienteRepo)
  const listarAmbientesUseCase = ListarAmbientesUseCase.create(ambienteRepo)
  const atualizarAmbienteUseCase = AtualizarAmbienteUseCase.create(ambienteRepo)
  const removerAmbienteUseCase = RemoverAmbienteUseCase.create(ambienteRepo, dispositivoRepo)

  const cadastrarDispositivoUseCase = CadastrarDispositivoUseCase.create(dispositivoRepo)
  const listarDispositivosUseCase = ListarDispositivosUseCase.create(dispositivoRepo)

  const cadastrarMedicaoUseCase = CadastrarMedicaoUseCase.create(medicaoRepo, dispositivoRepo)

  // Instanciar controllers
  const criarAmbienteController = CriarAmbienteController.create(criarAmbienteUseCase)
  const listarAmbientesController = ListarAmbientesController.create(listarAmbientesUseCase)
  const atualizarAmbienteController = AtualizarAmbienteController.create(atualizarAmbienteUseCase)
  const removerAmbienteController = RemoverAmbienteController.create(removerAmbienteUseCase)

  const cadastrarDispositivoController = CadastrarDispositivoController.create(
    cadastrarDispositivoUseCase,
  )
  const listarDispositivoController = ListarDispositivosController.create(listarDispositivosUseCase)

  const cadastrarMedicaoController = CadastrarMedicaoController.create(cadastrarMedicaoUseCase)

  // Conecta no Broker MQTT
  const clientMQTT = ClientMQTT.create(cadastrarMedicaoController)
  clientMQTT.subscribeTopic('+')

  // Instanciar as rotas
  const routes = Routes.create(
    criarAmbienteController,
    listarAmbientesController,
    atualizarAmbienteController,
    removerAmbienteController,

    cadastrarDispositivoController,
    listarDispositivoController,

    cadastrarMedicaoController,
  ).routes

  // Conecta no Servidor
  const server = ServerHTTP.create(routes)
  server.start()
}

main()
