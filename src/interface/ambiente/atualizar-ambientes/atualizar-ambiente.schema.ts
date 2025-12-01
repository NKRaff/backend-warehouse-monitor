import { z } from 'zod'

export const AtualizarAmbienteSchema = z.object({
  id: z.string(),
  nome: z.string().optional(),
  descricao: z.string().optional(),
})

export type AtualizarAmbienteInputDto = z.infer<typeof AtualizarAmbienteSchema>
