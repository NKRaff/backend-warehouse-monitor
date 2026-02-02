import type { TipoMedicao } from '../medicao/medicao.entity.js'
import type { Alerta } from './alerta.entity.js'

export interface AlertaRepository {
  save(alerta: Alerta): Promise<void>
  updateStatus(id: string, status: boolean): Promise<void>
  findAtivoPorAmbienteETipo(ambienteId: string, sensorTipo: TipoMedicao): Promise<Alerta | null>
  findById(id: string): Promise<Alerta>
}
