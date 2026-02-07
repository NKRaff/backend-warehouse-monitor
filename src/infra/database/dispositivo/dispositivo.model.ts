import { model, Schema } from 'mongoose'

const dispositivoSchema = new Schema(
  {
    _id: { type: String },
    nome: { type: String },
    ambienteId: { type: String, ref: 'Ambiente' },
  },
  { timestamps: true },
)

export const DispositivoModel = model('Dispositivo', dispositivoSchema)
