import { model, Schema } from 'mongoose'

const autenticacaoSchema = new Schema(
  {
    _id: { type: String },
    usuarioId: { type: String, ref: 'Usuario' },
    senha: { type: String },
  },
  { timestamps: true },
)

export const AutenticaoModel = model('Autenticacao', autenticacaoSchema)
