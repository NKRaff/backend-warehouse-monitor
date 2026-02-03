import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'

export function autenticarToken(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.token
  if (!token) return res.status(401).json({ error: 'Token não encontrado' })

  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret) throw new Error('JWT_SECRET não definido')

  try {
    const decoded = jwt.verify(token, jwtSecret)
    req.usuarioId = decoded.sub as string
    next()
  } catch {
    return res.status(401).json({ error: 'Token invalido' })
  }
}
