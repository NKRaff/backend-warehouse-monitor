import type { Medicao } from '@/domain/medicao/medicao.entity.js'

export namespace CadastrarMedicaoMapper {
  export function paraOutput(medicao: Medicao) {
    return {
      id: medicao.id,
    }
  }
}
