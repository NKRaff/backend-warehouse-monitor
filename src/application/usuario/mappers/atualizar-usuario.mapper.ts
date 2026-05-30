import type { Usuario } from '../../../domain/usuario/usuario.entity.js'

export namespace AtualizarUsuarioMapper {
  export function paraOutput(usuario: Usuario) {
    if (!usuario) {
      throw new Error('Usuario invalido')
    }
    return {
      id: usuario.id,
    }
  }
}
