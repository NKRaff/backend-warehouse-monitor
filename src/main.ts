import 'dotenv/config'
import { CriarAmbienteUseCase } from './application/ambiente/use-cases/criar-ambiente.usecase.js'
import { ListarAmbientesUseCase } from './application/ambiente/use-cases/listar-ambientes.usecase.js'
import { CadastrarDispositivoUseCase } from './application/dispositivo/use-cases/cadastrar-dispositivo.usecase.js'
import { CadastrarMedicaoUseCase } from './application/medicao/use-cases/cadastrar-medicao.usecase.js'
import { MongooseAmbienteRepository } from './infra/database/ambiente/ambiente.repository.js'
import { MongooseDispositivoRepository } from './infra/database/dispositivo/dispositivo.repository.js'
import { MongooseMedicaoRepository } from './infra/database/medicao/medicao.repository.js'
import { MongooseORM } from './infra/database/mongoose.config.js'
import { Routes } from './infra/http/routes/routes.js'
import { ServerHTTP } from './infra/http/server.js'
import { ClientMQTT } from './infra/mqtt/client.js'
import { CriarAmbienteController } from './interface/ambiente/criar-ambientes/criar-ambiente.controller.js'
import { ListarAmbientesController } from './interface/ambiente/listar-ambiestes/listar-ambientes.controller.js'
import { CadastrarDispositivoController } from './interface/dispositivo/cadastrar-dispositivo/cadastrar-dispositivo.controller.js'
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

  const cadastrarDispositivoUseCase = CadastrarDispositivoUseCase.create(dispositivoRepo)

  const cadastrarMedicaoUseCase = CadastrarMedicaoUseCase.create(medicaoRepo, dispositivoRepo)

  // Instanciar controllers
  const criarAmbienteController = CriarAmbienteController.create(criarAmbienteUseCase)
  const listarAmbientesController = ListarAmbientesController.create(listarAmbientesUseCase)

  const cadastrarDispositivoController = CadastrarDispositivoController.create(
    cadastrarDispositivoUseCase,
  )

  const cadastrarMedicaoController = CadastrarMedicaoController.create(cadastrarMedicaoUseCase)

  // Conecta no Broker MQTT
  const clientMQTT = ClientMQTT.create()
  clientMQTT.subscribeTopic('+')

  // Instanciar as rotas
  const routes = Routes.create(
    criarAmbienteController,
    listarAmbientesController,
    cadastrarDispositivoController,
    cadastrarMedicaoController,
  ).routes

  // Conecta no Servidor
  const server = ServerHTTP.create(routes)
  server.start()
}

main()
