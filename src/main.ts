import 'dotenv/config'
import { MongooseORM } from './infra/database/mongoose.config.js'
import { MongooseTemperaturaRepository } from './infra/database/sensor/repositories/temperatura.repository.js'
import { MongooseUmidadeRepository } from './infra/database/sensor/repositories/umidade.repository.js'
import { Routes } from './infra/http/routes/routes.js'
import { ServerHTTP } from './infra/http/server.js'

async function main() {
  // Conectar MongoDB
  const orm = MongooseORM.create()
  await orm.connectDatabase()

  // Instanciar repositorios
  const TemperaturaRepo = MongooseTemperaturaRepository.create()
  const UmidadeRepo = MongooseUmidadeRepository.create()

  // Instanciar as rotas
  const routes = Routes.create().routes

  // Conecta no Servidor
  const server = ServerHTTP.create(routes)
  server.start()
}

main()
