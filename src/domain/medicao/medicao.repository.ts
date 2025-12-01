import type { Medicao, TipoMedicao } from './medicao.entity.js'

export interface MedicaoRepository {
  save(medicao: Medicao): Promise<void>
  findById(id: string): Promise<Medicao>
  search(filters: {
    dispositivoId?: string
    ambienteId?: string
    tipo?: TipoMedicao
    minValor?: number
    maxValor?: number
    startData?: Date
    endData?: Date
  }): Promise<Medicao[]>
}
