import type { Usuario } from '../../../domain/usuario/usuario.entity.js'

export namespace BuscarUsuarioMapper {
  export function paraOutput(usuario: Usuario) {
    if (!usuario) {
      throw new Error('Usuario invalido')
    }
    return {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      receberEmail: usuario.receberEmail,
    }
  }
}
