import type { Medicao } from '../../../domain/medicao/medicao.entity.js'

export namespace BuscarMedicoesMapper {
  export function paraOutput(medicoes: Medicao[]) {
    return {
      medicoes: medicoes.map((medicao) => {
        return {
          id: medicao.id,
          dispositivoId: medicao.dispositivoId,
          ambienteId: medicao.ambienteId,
          tipo: medicao.tipo,
          valor: medicao.valor,
          createdAt: medicao.createdAt,
          updatedAt: medicao.updatedAt,
        }
      }),
    }
  }
}
