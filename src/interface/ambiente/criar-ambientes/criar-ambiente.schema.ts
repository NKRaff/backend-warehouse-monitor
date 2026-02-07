import type { TipoAmbiente } from '@/domain/ambiente/ambiente.entity.js'
import { z } from 'zod'

const tipos: TipoAmbiente[] = ['frio', 'arejado']
const TipoAmbienteSchema = z.union(tipos.map((t) => z.literal(t)))

export const CriarAmbienteSchema = z.object({
  nome: z.string().min(1),
  tipo: TipoAmbienteSchema,
  descricao: z.string().optional(),
  temperatura_minima: z.number(),
  temperatura_maxima: z.number(),
  umidade_minima: z.number(),
  umidade_maxima: z.number(),
})

export type CriarAmbienteInputDto = z.infer<typeof CriarAmbienteSchema>
