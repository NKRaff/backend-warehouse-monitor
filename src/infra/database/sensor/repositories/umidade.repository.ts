import { Umidade } from '@/domain/sensor/entities/umidade.entity.js'
import type { UmidadeRepository } from '@/domain/sensor/repositories/umidade.repository.js'
import { UmidadeModel } from '../models/umidade.model.js'

export class MongooseUmidadeRepository implements UmidadeRepository {
  private constructor() {}

  public static create() {
    return new MongooseUmidadeRepository()
  }

  public async save(umidade: Umidade) {
    const data = {
      id: umidade.id,
      umidade: umidade.umidade,
    }
    const umidadeDoc = new UmidadeModel(data)
    await umidadeDoc.save()
  }

  public async findAll(): Promise<Umidade[]> {
    const umidadeDocs = await UmidadeModel.find()
    return umidadeDocs.map((doc) => Umidade.create(doc.id, doc.umidade))
  }
}
