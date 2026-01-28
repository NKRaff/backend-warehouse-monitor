import express, { type Express, type Router } from 'express'

export class ServerHTTP {
  private app: Express

  private constructor(routes: Router) {
    this.app = express()
    
    // Habilitar CORS para comunicação com o frontend
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*')
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
      
      if (req.method === 'OPTIONS') {
        res.sendStatus(200)
      } else {
        next()
      }
    })
    
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

