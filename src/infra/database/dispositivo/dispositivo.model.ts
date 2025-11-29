import { model, Schema } from 'mongoose'

const dispositivoSchema = new Schema(
  {
    _id: { type: String },
    nome: { type: String, default: 'Sem Nome' },
    ambienteId: { type: String, required: true, ref: 'Ambiente' },
  },
  { timestamps: true },
)

export const DispositivoModel = model('Dispositivo', dispositivoSchema)
