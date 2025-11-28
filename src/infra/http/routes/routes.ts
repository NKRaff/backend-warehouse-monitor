import { Router } from 'express'

export class Routes {
  public readonly routes: Router

  private constructor() {
    this.routes = Router()
    this.setupRoutes()
  }

  public static create() {
    return new Routes()
  }

  public setupRoutes() {
    this.routes.get('/test', async (_req, res) => {
      res.status(200).send('ok')
    })
  }
}
