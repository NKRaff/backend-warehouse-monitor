import { z } from 'zod'
import type { TipoAmbiente } from '@/domain/ambiente/ambiente.entity.js'

const tipos: TipoAmbiente[] = ['frio', 'arejado']
const TipoAmbienteSchema = z.union(tipos.map((t) => z.literal(t)))

export const CriarAmbienteSchema = z.object({
  nome: z.string().min(1),
  tipo: TipoAmbienteSchema,
  descricao: z.string().optional(),
})

export type CriarAmbienteInputDto = z.infer<typeof CriarAmbienteSchema>
