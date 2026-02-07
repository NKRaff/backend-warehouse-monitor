import { z } from 'zod'

export const LoginSchema = z.object({
  email: z.email(),
  senha: z.string().min(8),
})

export type LoginInputDto = z.infer<typeof LoginSchema>
