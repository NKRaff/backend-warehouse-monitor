import { model, Schema } from 'mongoose'

const umidadeSchema = new Schema(
  {
    id: { type: String },
    umidade: { type: String, required: true },
  },
  { timestamps: true },
)

export const UmidadeModel = model('Umidade', umidadeSchema)
