import { z } from 'zod'

export const RemoverDispositivoSchema = z.object({
  id: z.string().min(1),
})

export type RemoverDispositivoInput = z.infer<typeof RemoverDispositivoSchema>
