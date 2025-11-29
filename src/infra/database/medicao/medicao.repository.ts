import type { Medicao } from '@/domain/medicao/medicao.entity.js'
import type { MedicaoRepository } from '@/domain/medicao/medicao.repository.js'
import { MedicaoModel } from './medicao.model.js'

export class MongooseMedicaoRepository implements MedicaoRepository {
  private constructor() {}

  public static create() {
    return new MongooseMedicaoRepository()
  }

  public async save(medicao: Medicao) {
    const data = {
      _id: medicao.id,
      dispositivoId: medicao.dispositivoId,
      ambienteId: medicao.ambienteId,
      tipo: medicao.tipo,
      valor: medicao.valor,
    }

    const medicaoDoc = new MedicaoModel(data)
    await medicaoDoc.save()
  }
}
