import { z } from 'zod'

export const AtualizarDispositivoSchema = z.object({
  id: z.string().min(1),
  nome: z.string().min(1),
  ambienteId: z.string().min(1),
})

export type AtualizarDispositivoInput = z.infer<typeof AtualizarDispositivoSchema>
