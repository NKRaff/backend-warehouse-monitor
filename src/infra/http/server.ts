import express, { type Express, type Router } from 'express'

export class ServerHTTP {
  private app: Express

  private constructor(routes: Router) {
    this.app = express()
    this.app.use(express.json())
    this.app.use(routes)
  }

  public static create(routes: Router) {
    return new ServerHTTP(routes)
  }

  public start() {
    this.app.listen(process.env.PORT || 3000, () => {
      console.log(`🖥️  Server rodando na porta ${process.env.PORT}`)
    })
  }
}
