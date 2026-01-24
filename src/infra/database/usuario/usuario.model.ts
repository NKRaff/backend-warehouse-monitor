import { model, Schema } from 'mongoose'

const usuarioSchema = new Schema(
  {
    _id: { type: String },
    nome: { type: String },
    email: { type: String, unique: true },
    senha: { type: String },
  },
  { timestamps: true },
)

export const UsuarioModel = model('Usuario', usuarioSchema)
