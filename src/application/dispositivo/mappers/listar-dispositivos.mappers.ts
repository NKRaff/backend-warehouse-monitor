import type { Dispositivo } from '../../../domain/dispositivo/dispositivo.entity.js'

export namespace ListarDispositivosMapper {
  export function paraOutput(dispositivos: Dispositivo[]) {
    if (!dispositivos) {
      throw new Error('Lista de Dispositivo invalido')
    }
    return {
      dispositivos: dispositivos.map((dispositivo) => {
        return {
          id: dispositivo.id,
          nome: dispositivo.nome,
          ambienteId: dispositivo.ambienteId,
        }
      }),
    }
  }
}
