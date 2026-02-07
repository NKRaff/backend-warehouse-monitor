import { z } from 'zod'

export const CadastrarDispositivoSchema = z.object({
  id: z.string().min(17).max(17),
  nome: z.string().min(1).optional(),
  ambienteId: z.string().optional(),
})

export type CadastrarDispositivoInputDto = z.infer<typeof CadastrarDispositivoSchema>
