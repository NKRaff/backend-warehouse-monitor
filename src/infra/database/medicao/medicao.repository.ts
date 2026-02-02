import { Medicao, type TipoMedicao } from '@/domain/medicao/medicao.entity.js'
import type { MedicaoRepository } from '@/domain/medicao/medicao.repository.js'
import { MedicaoModel } from './medicao.model.js'

type MedicaoMongo = {
  _id: string
  dispositivoId: string
  ambienteId: string
  tipo: TipoMedicao
  valor: number
  createdAt: Date
  updatedAt: Date
}

export class MongooseMedicaoRepository implements MedicaoRepository {
  private constructor() {}

  public static create() {
    return new MongooseMedicaoRepository()
  }

  public async save(medicao: Medicao) {
    await MedicaoModel.create({
      _id: medicao.id,
      dispositivoId: medicao.dispositivoId,
      ambienteId: medicao.ambienteId,
      tipo: medicao.tipo,
      valor: medicao.valor,
    })
  }

  public async findById(id: string): Promise<Medicao> {
    const medicaoDoc = await MedicaoModel.findById(id).lean<MedicaoMongo>()
    if (!medicaoDoc) throw new Error('Nenhuma medição com esse Id foi encontrada')
    return Medicao.create(
      medicaoDoc._id,
      medicaoDoc.dispositivoId,
      medicaoDoc.ambienteId,
      medicaoDoc.tipo,
      medicaoDoc.valor,
    )
  }

  public async search(filters: {
    dispositivoId?: string
    ambienteId?: string
    tipo?: TipoMedicao
    minValor?: number
    maxValor?: number
    startData?: Date
    endData?: Date
  }): Promise<Medicao[]> {
    const query: any = {}

    if (filters.dispositivoId) query.dispositivoId = filters.dispositivoId
    if (filters.ambienteId) query.ambienteId = filters.ambienteId
    if (filters.tipo) query.tipo = filters.tipo
    if (filters.minValor !== undefined || filters.maxValor !== undefined) {
      query.valor = {}
      if (filters.minValor !== undefined) query.valor.$gte = filters.minValor
      if (filters.maxValor !== undefined) query.valor.$lte = filters.maxValor
    }
    if (filters.startData || filters.endData) {
      query.createdAt = {}
      if (filters.startData) query.createdAt.$gte = filters.startData
      if (filters.endData) query.createdAt.$lte = filters.endData
    }

    const medicoesDoc = await MedicaoModel.find(query)
      .sort({ createdAt: -1 })
      .lean<MedicaoMongo[]>()
    return medicoesDoc.map((doc) =>
      Medicao.create(
        doc._id,
        doc.dispositivoId,
        doc.ambienteId,
        doc.tipo,
        doc.valor,
        doc.createdAt,
        doc.updatedAt,
      ),
    )
  }

  public async findLast(filters: {
    dispositivoId?: string
    ambienteId?: string
    tipo: TipoMedicao
  }): Promise<Medicao> {
    const query: any = {}
    if (filters.dispositivoId) query.dispositivoId = filters.dispositivoId
    if (filters.ambienteId) query.ambienteId = filters.ambienteId
    query.tipo = filters.tipo
    const medicaoDoc = await MedicaoModel.findOne(query)
      .sort({ createdAt: -1 })
      .lean<MedicaoMongo>()
    if (!medicaoDoc) throw new Error('Nenhuma medição encontrada')
    return Medicao.create(
      medicaoDoc._id,
      medicaoDoc.dispositivoId,
      medicaoDoc.ambienteId,
      medicaoDoc.tipo,
      medicaoDoc.valor,
      medicaoDoc.createdAt,
      medicaoDoc.updatedAt,
    )
  }
}
