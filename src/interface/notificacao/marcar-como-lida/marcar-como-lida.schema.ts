import { z } from 'zod'

export const MarcarComoLidaSchema = z.object({
  notificacaoId: z.string(),
})

export type MarcarComoLidaInputDto = z.infer<typeof MarcarComoLidaSchema>
