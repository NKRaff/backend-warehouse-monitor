import { model, Schema } from 'mongoose'

const notificacaoSchema = new Schema(
  {
    _id: { type: String },
    alertaId: { type: String, required: true, ref: 'Alerta' },
    usuarioId: { type: String, required: true, ref: 'Usuario' },
    lida: { type: Boolean, default: false },
  },
  { timestamps: true },
)

export const NotificacaoModel = model('Notificacao', notificacaoSchema)
