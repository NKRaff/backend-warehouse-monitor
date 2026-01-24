import { z } from 'zod'

export const RemoverUsuarioSchema = z.object({
  id: z.string().min(1),
})

export type RemoverUsuarioInput = z.infer<typeof RemoverUsuarioSchema>
