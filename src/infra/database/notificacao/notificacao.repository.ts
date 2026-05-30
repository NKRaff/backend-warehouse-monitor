import { Notificacao } from '../../../domain/notificacao/notificacao.entity.js'
import type { NotificacaoRepository } from '../../../domain/notificacao/notificacao.repository.js'
import { NotificacaoModel } from './notificacao.model.js'

type NotificacaoMongo = {
  _id: string
  alertaId: string
  usuarioId: string
  lida?: boolean
}

export class MongooseNotificacaoRepository implements NotificacaoRepository {
  private constructor() {}

  public static create() {
    return new MongooseNotificacaoRepository()
  }

  public async save(notificacao: Notificacao): Promise<void> {
    await NotificacaoModel.create({
      _id: notificacao.id,
      alertaId: notificacao.alertaId,
      usuarioId: notificacao.usuarioId,
      lida: notificacao.lida,
    })
  }

  public async findByUsuario(usuarioId: string): Promise<Notificacao[]> {
    const notificacoesDoc = await NotificacaoModel.find({ usuarioId })
      .sort({ createdAt: -1 })
      .lean<NotificacaoMongo[]>()
    return notificacoesDoc.map((doc) =>
      Notificacao.create(doc._id, doc.alertaId, doc.usuarioId, doc.lida),
    )
  }

  public async findById(id: string): Promise<Notificacao> {
    const notificacao = await NotificacaoModel.findById(id).lean<NotificacaoMongo>()
    if (!notificacao) throw new Error('Notificação não encontrada')
    return Notificacao.create(
      notificacao._id,
      notificacao.alertaId,
      notificacao.usuarioId,
      notificacao.lida,
    )
  }

  public async updateLida(id: string, notificacao: Notificacao): Promise<void> {
    await NotificacaoModel.findByIdAndUpdate(id, { lida: notificacao.lida })
  }
}
