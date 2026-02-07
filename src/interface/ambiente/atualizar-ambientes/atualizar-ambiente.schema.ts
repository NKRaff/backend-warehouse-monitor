import { z } from 'zod'

export const AtualizarAmbienteSchema = z.object({
  id: z.string(),
  nome: z.string().optional(),
  descricao: z.string().optional(),
  temperatura_minima: z.number().optional(),
  temperatura_maxima: z.number().optional(),
  umidade_minima: z.number().optional(),
  umidade_maxima: z.number().optional(),
})

export type AtualizarAmbienteInputDto = z.infer<typeof AtualizarAmbienteSchema>
