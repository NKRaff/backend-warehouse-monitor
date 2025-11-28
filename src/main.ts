import 'dotenv/config'
import { Routes } from './infra/http/routes/routes.js'
import { ServerHTTP } from './infra/http/server.js'

async function main() {
  // 1. Instanciar as rotas
  const routes = Routes.create().routes

  // 2. Conecta no Servidor
  const server = ServerHTTP.create(routes)
  server.start()
}

main()
