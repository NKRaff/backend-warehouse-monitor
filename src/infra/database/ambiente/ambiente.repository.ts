import { Ambiente } from '@/domain/ambiente/ambiente.entity.js'
import type { AmbienteRepository } from '@/domain/ambiente/ambiente.repository.js'
import { AmbienteModel } from './ambiente.model.js'

export class MongooseAmbienteRepository implements AmbienteRepository {
  private constructor() {}

  public static create() {
    return new MongooseAmbienteRepository()
  }

  public async save(ambiente: Ambiente): Promise<void> {
    const data = {
      _id: ambiente.id,
      nome: ambiente.nome,
      tipo: ambiente.tipo,
      descricao: ambiente.descricao,
    }

    const ambienteDoc = new AmbienteModel(data)
    await ambienteDoc.save()
  }

  public async findAll(): Promise<Ambiente[]> {
    const ambientesDoc = await AmbienteModel.find()
    return ambientesDoc.map((doc) => Ambiente.create(doc.id, doc.nome, doc.tipo, doc.descricao))
  }
}
