import type { Medicao } from '../../../domain/medicao/medicao.entity.js'

export namespace CadastrarMedicaoMapper {
  export function paraOutput(medicao: Medicao) {
    if (!medicao) {
      throw new Error('Medição invalida')
    }
    return {
      id: medicao.id,
    }
  }
}
