import type { Usuario } from '@/domain/usuario/usuario.entity.js'

export namespace AtualizarUsuarioMapper {
  export function paraOutput(usuario: Usuario) {
    return {
      id: usuario.id,
    }
  }
}
