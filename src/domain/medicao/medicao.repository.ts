import type { Medicao } from './medicao.entity.js'

export interface MedicaoRepository {
  save(medicao: Medicao): Promise<void>
}
