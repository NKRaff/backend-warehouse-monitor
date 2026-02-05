import { z } from 'zod'

export const AtualizarUsuarioSchema = z.object({
  id: z.string(),
  nome: z.string().optional(),
  email: z.email().optional(),
  receberEmail: z.boolean().optional(),
})

export type AtualizarUsuarioInputDto = z.infer<typeof AtualizarUsuarioSchema>
