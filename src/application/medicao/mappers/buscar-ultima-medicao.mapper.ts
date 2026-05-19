import type { Medicao } from '@/domain/medicao/medicao.entity.js'

export namespace BuscarUltimaMedicaoMapper {
  export function paraOutput(medicao: Medicao) {
    return {
      id: medicao.id,
      dispositivoId: medicao.dispositivoId,
      ambienteId: medicao.ambienteId,
      tipo: medicao.tipo,
      valor: medicao.valor,
      createdAt: medicao.createdAt,
      updatedAt: medicao.updatedAt,
    }
  }
}
