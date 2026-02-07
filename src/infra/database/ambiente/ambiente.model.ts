import { model, Schema } from 'mongoose'

const ambienteSchema = new Schema(
  {
    _id: { type: String },
    nome: { type: String, required: true },
    tipo: { type: String, required: true, enum: ['frio', 'arejado'] },
    descricao: { type: String, default: 'Sem descrição' },
    temperatura_minima: { type: Number, required: true },
    temperatura_maxima: { type: Number, required: true },
    umidade_minima: { type: Number, required: true },
    umidade_maxima: { type: Number, required: true },
  },
  { timestamps: true },
)

export const AmbienteModel = model('Ambiente', ambienteSchema)
