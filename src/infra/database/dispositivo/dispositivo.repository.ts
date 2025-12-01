import type { DispositivoRepository } from '@/domain/dispositivo/despositivo.repository.js'
import { Dispositivo } from '@/domain/dispositivo/dispositivo.entity.js'
import { DispositivoModel } from './dispositivo.model.js'

type DispositivoMongo = {
  _id: string
  nome: string
  ambienteId: string
}

export class MongooseDispositivoRepository implements DispositivoRepository {
  private constructor() {}

  public static create() {
    return new MongooseDispositivoRepository()
  }

  public async save(dispositivo: Dispositivo): Promise<void> {
    await DispositivoModel.create({
      _id: dispositivo.id,
      nome: dispositivo.nome,
      ambienteId: dispositivo.ambienteId,
    })
  }

  public async findAll(): Promise<Dispositivo[]> {
    const dispositivosDoc = await DispositivoModel.find().lean<DispositivoMongo[]>()
    return dispositivosDoc.map((doc) => Dispositivo.create(doc._id, doc.nome, doc.ambienteId))
  }

  public async findById(id: string): Promise<Dispositivo> {
    const dispositivoDoc = await DispositivoModel.findById(id).lean<DispositivoMongo>()
    if (!dispositivoDoc) throw new Error('Nenhum dispositivo com esse Id encontrado')
    return Dispositivo.create(dispositivoDoc._id, dispositivoDoc.nome, dispositivoDoc.ambienteId)
  }

  public async update(dispositivo: Dispositivo): Promise<void> {
    const dispositivoDoc = await DispositivoModel.findByIdAndUpdate(dispositivo.id, {
      nome: dispositivo.nome,
      ambienteId: dispositivo.ambienteId,
    })

    if (!dispositivoDoc) throw new Error('Nenhum dispositivo com esse Id encontrado')
  }

  public async delete(id: string): Promise<void> {
    const dispositivoDoc = await DispositivoModel.findByIdAndDelete(id)
    if (!dispositivoDoc) throw new Error('Nenhum dispositivo com esse Id encontrado')
  }
}
