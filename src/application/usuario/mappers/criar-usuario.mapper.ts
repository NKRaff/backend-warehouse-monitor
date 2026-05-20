import type { Usuario } from '../../../domain/usuario/usuario.entity.js'

export namespace CriarUsuarioMapper {
  export function paraOutput(usuario: Usuario) {
    if (!usuario || usuario === null) {
      throw new Error('Usuario invalido')
    }
    return {
      id: usuario.id,
    }
  }
}
