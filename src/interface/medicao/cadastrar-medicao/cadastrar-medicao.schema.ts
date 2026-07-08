import z from 'zod'
import type { TipoMedicao } from '../../../domain/medicao/medicao.entity.js'

const tipos: TipoMedicao[] = ['temperatura', 'umidade']
const TipoMedicaoSchema = z.union(tipos.map((t) => z.literal(t)))

export const CadastrarMedicaoSchema = z.object({
  dispositivoId: z.string().min(17).max(17),
  tipo: TipoMedicaoSchema,
  valor: z
    .string()
    .transform((v) => Number(v))
    .refine((v) => !Number.isNaN(v), {
      message: 'Valor deve ser um número válido',
    }),
})
