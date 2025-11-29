import { model, Schema } from 'mongoose'

const ambienteSchema = new Schema(
  {
    _id: { type: String },
    nome: { type: String, required: true },
    tipo: { type: String, required: true, enum: ['frio', 'arejado'] },
    descricao: { type: String, default: 'Sem descrição' },
  },
  { timestamps: true },
)

export const AmbienteModel = model('Ambiente', ambienteSchema)
