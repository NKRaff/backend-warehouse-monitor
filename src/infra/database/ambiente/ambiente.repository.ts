import { Ambiente, type TipoAmbiente } from '../../../domain/ambiente/ambiente.entity.js'
import type { AmbienteRepository } from '../../../domain/ambiente/ambiente.repository.js'
import { AmbienteModel } from './ambiente.model.js'

type AmbienteMongo = {
  _id: string
  nome: string
  tipo: TipoAmbiente
  descricao: string
  temperatura_minima: number
  temperatura_maxima: number
  umidade_minima: number
  umidade_maxima: number
}

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
      temperatura_minima: ambiente.temperaturaMinima,
      temperatura_maxima: ambiente.temperaturaMaxima,
      umidade_minima: ambiente.umidadeMinima,
      umidade_maxima: ambiente.umidadeMaxima,
    })
  }

  public async findAll(): Promise<Ambiente[]> {
    const ambientesDoc = await AmbienteModel.find().lean<AmbienteMongo[]>()
    return ambientesDoc.map((doc) =>
      Ambiente.create(
        doc._id,
        doc.nome,
        doc.tipo,
        doc.temperatura_minima,
        doc.temperatura_maxima,
        doc.umidade_minima,
        doc.umidade_maxima,
        doc.descricao,
      ),
    )
  }

  public async findById(id: string): Promise<Ambiente> {
    const ambienteDoc = await AmbienteModel.findById(id).lean<AmbienteMongo>()
    if (!ambienteDoc) throw new Error('Nenhum ambiente com esse Id foi encontrado.')
    return Ambiente.create(
      ambienteDoc._id,
      ambienteDoc.nome,
      ambienteDoc.tipo,
      ambienteDoc.temperatura_minima,
      ambienteDoc.temperatura_maxima,
      ambienteDoc.umidade_minima,
      ambienteDoc.umidade_maxima,
      ambienteDoc.descricao,
    )
  }

  public async update(ambiente: Ambiente): Promise<void> {
    const ambienteDoc = await AmbienteModel.findByIdAndUpdate(ambiente.id, {
      nome: ambiente.nome,
      tipo: ambiente.tipo,
      descricao: ambiente.descricao,
      temperatura_minima: ambiente.temperaturaMinima,
      temperatura_maxima: ambiente.temperaturaMaxima,
      umidade_minima: ambiente.umidadeMinima,
      umidade_maxima: ambiente.umidadeMaxima,
    })

    if (!ambienteDoc) throw new Error('Nenhum ambiente com esse Id foi encontrado.')
  }

  public async delete(id: string): Promise<void> {
    const ambienteDoc = await AmbienteModel.findByIdAndDelete(id)
    if (!ambienteDoc) throw new Error('Nenhum ambiente com esse Id foi encontrado.')
  }
}
