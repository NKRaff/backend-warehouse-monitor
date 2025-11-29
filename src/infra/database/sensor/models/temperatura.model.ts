import { model, Schema } from 'mongoose'

const temperaturaSchema = new Schema(
  {
    id: { type: String },
    temperatura: { type: String, required: true },
  },
  {
    timestamps: true,
  },
)

export const TemperaturaModel = model('Temperatura', temperaturaSchema)
