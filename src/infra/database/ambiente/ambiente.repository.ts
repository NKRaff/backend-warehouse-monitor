import { Ambiente, type AmbienteProps } from '@/domain/ambiente/ambiente.entity.js'
import type { AmbienteRepository } from '@/domain/ambiente/ambiente.repository.js'
import { AmbienteModel } from './ambiente.model.js'

export class MongooseAmbienteRepository implements AmbienteRepository {
  private constructor() {}

  public static create() {
    return new MongooseAmbienteRepository()
  }

  public async save(ambiente: Ambiente): Promise<void> {
    await AmbienteModel.create({
      _id: ambiente.id,
      nome: ambiente.nome,
      tipo: ambiente.tipo,
      descricao: ambiente.descricao,
    })
  }

  public async findAll(): Promise<Ambiente[]> {
    const ambientesDoc = await AmbienteModel.find().lean<AmbienteProps[]>()
    return ambientesDoc.map((doc) => Ambiente.create(doc.id, doc.nome, doc.tipo, doc.descricao))
  }

  public async findById(id: string): Promise<Ambiente> {
    const ambienteDoc = await AmbienteModel.findById(id).lean<AmbienteProps>()
    if (!ambienteDoc) throw new Error('Nenhum ambiente com esse Id foi encontrado.')
    return Ambiente.create(
      ambienteDoc.id,
      ambienteDoc.nome,
      ambienteDoc.tipo,
      ambienteDoc.descricao,
    )
  }

  public async update(ambiente: Ambiente): Promise<void> {
    const ambienteDoc = await AmbienteModel.findByIdAndUpdate(ambiente.id, {
      nome: ambiente.nome,
      tipo: ambiente.tipo,
      descricao: ambiente.descricao,
    })

    if (!ambienteDoc) throw new Error('Nenhum ambiente com esse Id foi encontrado.')
  }

  public async delete(id: string): Promise<void> {
    const ambienteDoc = await AmbienteModel.findByIdAndDelete(id)
    if (!ambienteDoc) throw new Error('Nenhum ambiente com esse Id foi encontrado.')
  }
}
