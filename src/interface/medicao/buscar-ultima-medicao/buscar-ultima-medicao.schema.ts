import { z } from 'zod'
import type { TipoMedicao } from '../../../domain/medicao/medicao.entity.js'

const tipos: TipoMedicao[] = ['temperatura', 'umidade']
const TipoMedicaoSchema = z.union(tipos.map((t) => z.literal(t)))

export const BuscarUltimaMedicaoSchema = z.object({
  dispositivoId: z.string().min(17).max(17).optional(),
  ambienteId: z.string().optional(),
  tipo: TipoMedicaoSchema,
})
