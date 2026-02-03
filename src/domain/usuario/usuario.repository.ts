import type { Usuario } from './usuario.entity.js'

export interface UsuarioRepository {
  save(usuario: Usuario): Promise<void>
  findById(id: string): Promise<Usuario>
  findByEmail(email: string): Promise<Usuario>
  findAll(): Promise<Usuario[]>
  delete(id: string): Promise<void>
  updateRecebimentoEmail(id: string, usuario: Usuario): Promise<void>
}
