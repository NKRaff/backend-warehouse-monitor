import { model, Schema } from 'mongoose'

const medicaoSchema = new Schema(
  {
    _id: { type: String },
    dispositivoId: { type: String, required: true, ref: 'Dispositivo' },
    ambienteId: { type: String, required: true, ref: 'Ambiente' },
    tipo: { type: String, required: true, enum: ['temperatura', 'umidade'] },
    valor: { type: Number, required: true },
  },
  { timestamps: true },
)

export const MedicaoModel = model('Medicao', medicaoSchema)
