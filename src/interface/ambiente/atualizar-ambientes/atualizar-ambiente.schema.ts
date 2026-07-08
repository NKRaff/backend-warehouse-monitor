import { z } from 'zod'
import type { TipoAmbiente } from '../../../domain/ambiente/ambiente.entity.js'

const tipos: TipoAmbiente[] = ['frio', 'arejado']
const TipoAmbienteSchema = z.union(tipos.map((t) => z.literal(t)))

export const AtualizarAmbienteSchema = z.object({
  id: z.string(),
  nome: z.string().optional(),
  tipo: TipoAmbienteSchema.optional(),
  descricao: z.string().optional(),
  temperatura_minima: z.number().optional(),
  temperatura_maxima: z.number().optional(),
  umidade_minima: z.number().optional(),
  umidade_maxima: z.number().optional(),
})

export type AtualizarAmbienteInputDto = z.infer<typeof AtualizarAmbienteSchema>
