import { model, Schema } from 'mongoose'

const usuarioSchema = new Schema(
  {
    _id: { type: String },
    nome: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    receber_email: { type: Boolean, required: true },
  },
  { timestamps: true },
)

export const UsuarioModel = model('Usuario', usuarioSchema)
