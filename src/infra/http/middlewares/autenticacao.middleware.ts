import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'

export function autenticarToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ error: 'Token não informado' })

  const token = authHeader.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'Token não autorizado' })

  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret) throw new Error('JWT_SECRET não definido')

  jwt.verify(token, jwtSecret, (err, decoded) => {
    if (err || !decoded || typeof decoded === 'string')
      return res.status(401).json({ error: 'Token inválido' })

    const { sub } = decoded
    req.usuarioId = sub as string

    next()
  })
}
