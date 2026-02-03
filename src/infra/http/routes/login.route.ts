import type { LoginController } from '@/interface/autenticacao/logar/logar.controller.js'
import { Router } from 'express'

export class LoginRoutes {
  public readonly routes: Router

  private constructor(private readonly loginController: LoginController) {
    this.routes = Router()
    this.setupRoutes()
  }

  public static create(loginController: LoginController) {
    return new LoginRoutes(loginController)
  }

  private setupRoutes() {
    this.routes.post('/', async (req, res) => {
      try {
        const result = await this.loginController.handle(req.body)
        res.cookie('token', result.token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 60 * 60 * 1000,
        })
        res.status(200).json({ message: 'Autenticado com sucesso!' })
      } catch (error) {
        res.status(400).json(error)
      }
    })
  }
}
