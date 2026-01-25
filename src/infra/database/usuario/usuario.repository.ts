import { Usuario } from '@/domain/usuario/usuario.entity.js'
import type { UsuarioRepository } from '@/domain/usuario/usuario.repository.js'
import { UsuarioModel } from './usuario.model.js'

type UsuarioMongo = {
  _id: string
  nome: string
  email: string
}

export class MongooseUsuarioRepository implements UsuarioRepository {
  private constructor() {}

  public static create() {
    return new MongooseUsuarioRepository()
  }

  async save(usuario: Usuario): Promise<void> {
    await UsuarioModel.create({
      _id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
    })
  }

  async findById(id: string): Promise<Usuario> {
    const usuarioDoc = await UsuarioModel.findById(id).lean<UsuarioMongo>()
    if (!usuarioDoc) throw new Error('Nenhum usuario encontrado')
    return Usuario.create(usuarioDoc._id, usuarioDoc.nome, usuarioDoc.email)
  }

  async findByEmail(email: string): Promise<Usuario> {
    const usuarioDoc = await UsuarioModel.find({ email }).lean<UsuarioMongo>()
    if (!usuarioDoc) throw new Error('Nenhum usuario encontrado')
    return Usuario.create(usuarioDoc._id, usuarioDoc.nome, usuarioDoc.email)
  }

  async delete(id: string): Promise<void> {
    const usuarioDoc = await UsuarioModel.findByIdAndDelete(id)
    if (!usuarioDoc) throw new Error('Nenhum usuario encontrado')
  }
}
