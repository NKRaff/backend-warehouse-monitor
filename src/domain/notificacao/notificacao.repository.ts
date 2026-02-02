import type { Notificacao } from './notificacao.entity.js'

export interface NotificacaoRepository {
  save(notificacao: Notificacao): Promise<void>
  findByUsuario(usuarioId: string): Promise<Notificacao[]>
  findById(id: string): Promise<Notificacao>
  updateLida(id: string, notificacao: Notificacao): Promise<void>
}
