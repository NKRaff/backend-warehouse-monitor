import { z } from 'zod'

export const BuscarUsuarioSchema = z.object({
  id: z.string(),
})

export type BuscarUsuarioInputDto = z.infer<typeof BuscarUsuarioSchema>
