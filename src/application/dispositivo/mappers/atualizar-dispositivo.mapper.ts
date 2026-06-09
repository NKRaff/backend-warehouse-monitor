import type { Dispositivo } from '../../../domain/dispositivo/dispositivo.entity.js'

export namespace AtualizarDispositivoMapper {
  export function paraOutput(dispositivo: Dispositivo) {
    if (!dispositivo) {
      throw new Error('Dispositivo invalido')
    }
    return {
      id: dispositivo.id,
    }
  }
}
