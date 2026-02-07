import type { TipoMedicao } from '@/domain/medicao/medicao.entity.js'
import { z } from 'zod'

const tipos: TipoMedicao[] = ['temperatura', 'umidade']
const TipoMedicaoSchema = z.union(tipos.map((t) => z.literal(t)))

export const BuscarMedicoesSchema = z.object({
  dispositivoId: z.string().min(17).max(17).optional(),
  ambienteId: z.string().optional(),
  tipo: TipoMedicaoSchema.optional(),
  minValor: z.number().optional(),
  maxValor: z.number().optional(),
  startData: z.date().optional(),
  endData: z.date().optional(),
})
