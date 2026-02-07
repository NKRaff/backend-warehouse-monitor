import type { Autenticacao } from './autenticacao.entity.js'

export interface AutenticacaoRepository {
  save(autenticacao: Autenticacao): Promise<void>
  findByUsuarioId(usuarioId: string): Promise<Autenticacao>
  findById(id: string): Promise<Autenticacao>
  delete(id: string): Promise<void>
}
