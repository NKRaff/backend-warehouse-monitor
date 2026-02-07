import { z } from 'zod'

export const CriarUsuarioSchema = z.object({
  nome: z.string().min(4),
  email: z.email(),
  senha: z.string().min(8),
  receberEmail: z.boolean(),
})

export type CriarUsuarioInputDto = z.infer<typeof CriarUsuarioSchema>
