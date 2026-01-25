import { Autenticacao } from '@/domain/autenticacao/autenticacao.entity.js'
import type { AutenticacaoRepository } from '@/domain/autenticacao/autenticacao.repository.js'
import { AutenticaoModel } from './autenticacao.model.js'

type AutenticacaoMongo = {
  _id: string
  usuarioId: string
  senha: string
}

export class MongooseAutenticacaoRepository implements AutenticacaoRepository {
  private constructor() {}

  public static create() {
    return new MongooseAutenticacaoRepository()
  }

  async save(autenticacao: Autenticacao): Promise<void> {
    await AutenticaoModel.create({
      _id: autenticacao.id,
      usuarioId: autenticacao.usuarioId,
      senha: autenticacao.senha,
    })
  }

  async findByUsuarioId(usuarioId: string): Promise<Autenticacao> {
    const autenticacaoDoc = await AutenticaoModel.find({ usuarioId }).lean<AutenticacaoMongo>()
    if (!autenticacaoDoc) throw new Error('Usuario não encontrado')
    return Autenticacao.create(
      autenticacaoDoc._id,
      autenticacaoDoc.usuarioId,
      autenticacaoDoc.senha,
    )
  }

  async findById(id: string): Promise<Autenticacao> {
    const autenticacaoDoc = await AutenticaoModel.findById(id).lean<AutenticacaoMongo>()
    if (!autenticacaoDoc) throw new Error('Usuario não encontrado')
    return Autenticacao.create(
      autenticacaoDoc._id,
      autenticacaoDoc.usuarioId,
      autenticacaoDoc.senha,
    )
  }

  async delete(id: string): Promise<void> {
    const autenticacaoDoc = await AutenticaoModel.findByIdAndDelete(id)
    if (!autenticacaoDoc) throw new Error('Nenhum usuario encontrado')
  }
}
