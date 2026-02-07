import { z } from 'zod'

export const AtualizarDispositivoSchema = z.object({
  id: z.string().min(1),
  nome: z.string().optional(),
  ambienteId: z.string().optional(),
})

export type AtualizarDispositivoInput = z.infer<typeof AtualizarDispositivoSchema>
