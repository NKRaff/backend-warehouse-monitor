import type { TipoMedicao } from '@/domain/medicao/medicao.entity.js'
import z from 'zod'

const tipos: TipoMedicao[] = ['temperatura', 'umidade']
const TipoMedicaoSchema = z.union(tipos.map((t) => z.literal(t)))

export const CadastrarMedicaoSchema = z.object({
  dispositivoId: z.string().min(17).max(17),
  ambienteId: z.string(),
  tipo: TipoMedicaoSchema,
  valor: z.number(),
})
