import 'dotenv/config'
import { CriarAmbienteUseCase } from './application/ambiente/use-cases/criar-ambiente.usecase.js'
import { ListarAmbientesUseCase } from './application/ambiente/use-cases/listar-ambientes.usecase.js'
import { MongooseAmbienteRepository } from './infra/database/ambiente/ambiente.repository.js'
import { MongooseORM } from './infra/database/mongoose.config.js'
import { MongooseTemperaturaRepository } from './infra/database/sensor/repositories/temperatura.repository.js'
import { MongooseUmidadeRepository } from './infra/database/sensor/repositories/umidade.repository.js'
import { Routes } from './infra/http/routes/routes.js'
import { ServerHTTP } from './infra/http/server.js'
import { ClientMQTT } from './infra/mqtt/client.js'
import { CriarAmbienteController } from './interface/ambiente/criar-ambientes/criar-ambiente.controller.js'
import { ListarAmbientesController } from './interface/ambiente/listar-ambiestes/listar-ambientes.controller.js'

async function main() {
  // Conectar MongoDB
  const orm = MongooseORM.create()
  await orm.connectDatabase()

  // Instanciar repositorios
  const TemperaturaRepo = MongooseTemperaturaRepository.create()
  const UmidadeRepo = MongooseUmidadeRepository.create()
  const ambienteRepo = MongooseAmbienteRepository.create()

  // Instanciar use cases
  const criarAmbienteUseCase = CriarAmbienteUseCase.create(ambienteRepo)
  const listarAmbientesUseCase = ListarAmbientesUseCase.create(ambienteRepo)

  // Instanciar controllers
  const criarAmbienteController = CriarAmbienteController.create(criarAmbienteUseCase)
  const listarAmbientesController = ListarAmbientesController.create(listarAmbientesUseCase)

  // Conecta no Broker MQTT
  const clientMQTT = ClientMQTT.create()
  clientMQTT.subscribeTopic('+')

  // Instanciar as rotas
  const routes = Routes.create(criarAmbienteController, listarAmbientesController).routes

  // Conecta no Servidor
  const server = ServerHTTP.create(routes)
  server.start()
}

main()
