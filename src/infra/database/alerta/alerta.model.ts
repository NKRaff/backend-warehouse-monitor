import { model, Schema } from 'mongoose'

const alertaSchema = new Schema(
  {
    _id: { type: String },
    dispositivoId: { type: String, required: true, ref: 'Dispositivo' },
    ambienteId: { type: String, required: true, ref: 'Ambiente' },
    tipo: {
      type: String,
      required: true,
      enum: ['sensor_fora_do_range', 'dispositivo_inoperante'],
    },
    nivel: { type: String, required: true, enum: ['aviso', 'critico'] },
    mensagem: { type: String, required: true },
    ativo: { type: Boolean, default: true },
    sensorTipo: { type: String, required: false, enum: ['temperatura', 'umidade'] },
    valorAtual: { type: Number, required: false },
    limiteMin: { type: Number, required: false },
    limiteMax: { type: Number, required: false },
  },
  { timestamps: true },
)

export const AlertaModel = model('Alerta', alertaSchema)
