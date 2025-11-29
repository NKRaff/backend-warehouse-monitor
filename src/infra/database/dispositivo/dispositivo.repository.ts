import type { DispositivoRepository } from '@/domain/dispositivo/despositivo.repository.js'
import { Dispositivo } from '@/domain/dispositivo/dispositivo.entity.js'
import { DispositivoModel } from './dispositivo.model.js'

export class MongooseDispositivoRepository implements DispositivoRepository {
  private constructor() {}

  public static create() {
    return new MongooseDispositivoRepository()
  }

  public async save(dispositivo: Dispositivo): Promise<void> {
    const data = {
      _id: dispositivo.id,
      nome: dispositivo.nome,
      ambienteId: dispositivo.ambienteId,
    }

    const dispositivoDoc = new DispositivoModel(data)
    await dispositivoDoc.save()
  }

  public async findAll(): Promise<Dispositivo[]> {
    const dispositivosDoc = await DispositivoModel.find()
    return dispositivosDoc.map((doc) => Dispositivo.create(doc.id, doc.nome, doc.ambienteId))
  }
}
