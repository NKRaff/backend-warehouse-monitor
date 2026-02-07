import { z } from 'zod'

export const RemoverAmbienteSchema = z.object({
  id: z.string(),
})

export type RemoverAmbienteInputDto = z.infer<typeof RemoverAmbienteSchema>
