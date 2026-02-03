import { Alerta, type NivelAlerta, type TipoAlerta } from '@/domain/alerta/alerta.entity.js'
import type { AlertaRepository } from '@/domain/alerta/alerta.repository.js'
import type { TipoMedicao } from '@/domain/medicao/medicao.entity.js'
import { AlertaModel } from './alerta.model.js'

type AlertaMongo = {
  _id: string
  dispositivoId: string
  ambienteId: string
  tipo: TipoAlerta
  nivel: NivelAlerta
  mensagem: string
  ativo: boolean
  sensorTipo?: TipoMedicao
  valorAtual?: number
  limiteMin?: number
  limiteMax?: number
}

export class MongooseAlertaRepository implements AlertaRepository {
  private constructor() {}

  public static create() {
    return new MongooseAlertaRepository()
  }

  public async save(alerta: Alerta): Promise<void> {
    await AlertaModel.create({
      _id: alerta.id,
      dispositivoId: alerta.dispositivoId,
      ambienteId: alerta.ambienteId,
      tipo: alerta.tipo,
      nivel: alerta.nivel,
      mensagem: alerta.mensagem,
      ativo: alerta.ativo,
      sensorTipo: alerta.sensorTipo,
      valorAtual: alerta.valorAtual,
      limiteMin: alerta.limiteMin,
      limiteMax: alerta.limiteMax,
    })
  }

  public async updateStatus(id: string, status: boolean): Promise<void> {
    await AlertaModel.findByIdAndUpdate(id, { ativo: status })
  }

  public async findAtivoPorAmbienteETipo(
    ambienteId: string,
    sensorTipo: TipoMedicao,
  ): Promise<Alerta | null> {
    const filters = { ambienteId, sensorTipo, ativo: true }
    const alerta = await AlertaModel.findOne(filters).lean<AlertaMongo>()
    if (!alerta) return null
    return Alerta.create(
      alerta._id,
      alerta.dispositivoId,
      alerta.ambienteId,
      alerta.tipo,
      alerta.nivel,
      alerta.mensagem,
      alerta.ativo,
      alerta.sensorTipo,
      alerta.valorAtual,
      alerta.limiteMin,
      alerta.limiteMax,
    )
  }

  public async findById(id: string): Promise<Alerta> {
    const alertaDoc = await AlertaModel.findById(id).lean<AlertaMongo>()
    if (!alertaDoc) throw new Error('Nenhum alerta com esse id encontrado')
    return Alerta.create(
      alertaDoc._id,
      alertaDoc.dispositivoId,
      alertaDoc.ambienteId,
      alertaDoc.tipo,
      alertaDoc.nivel,
      alertaDoc.mensagem,
      alertaDoc.ativo,
      alertaDoc.sensorTipo,
      alertaDoc.valorAtual,
      alertaDoc.limiteMin,
      alertaDoc.limiteMax,
    )
  }
}
