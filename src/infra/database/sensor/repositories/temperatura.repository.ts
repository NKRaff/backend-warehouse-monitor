import { Temperatura } from '@/domain/sensor/entities/temperatura.entity.js'
import type { TemperaturaRepository } from '@/domain/sensor/repositories/temperatura.repository.js'
import { TemperaturaModel } from '../models/temperatura.model.js'

export class MongooseTemperaturaRepository implements TemperaturaRepository {
  private constructor() {}

  public static create() {
    return new MongooseTemperaturaRepository()
  }

  public async save(temperatura: Temperatura) {
    const data = {
      id: temperatura.id,
      temperatura: temperatura.temperatura,
    }
    const temperaturaDoc = new TemperaturaModel(data)
    await temperaturaDoc.save()
  }

  public async findAll(): Promise<Temperatura[]> {
    const temperaturaDocs = await TemperaturaModel.find()
    return temperaturaDocs.map((doc) => Temperatura.create(doc.id, doc.temperatura))
  }
}
