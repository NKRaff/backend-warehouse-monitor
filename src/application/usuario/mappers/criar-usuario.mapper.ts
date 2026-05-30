import type { Usuario } from '../../../domain/usuario/usuario.entity.js'

export namespace CriarUsuarioMapper {
  export function paraOutput(usuario: Usuario) {
    return {
      id: usuario.id,
    }
  }
}
