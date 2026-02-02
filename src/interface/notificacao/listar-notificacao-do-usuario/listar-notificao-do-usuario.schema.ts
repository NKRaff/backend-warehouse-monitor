import { z } from 'zod'

export const ListarNotificacaoDoUsuarioSchema = z.object({
  usuarioId: z.string(),
})

export type ListarNotificacaoDoUsuarioInputDto = z.infer<typeof ListarNotificacaoDoUsuarioSchema>
