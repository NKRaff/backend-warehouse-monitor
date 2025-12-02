import type { Dispositivo } from '@/domain/dispositivo/dispositivo.entity.js'

export namespace AtualizarDispositivoMapper {
  export function paraOutput(dispositivo: Dispositivo) {
    return {
      id: dispositivo.id,
    }
  }
}
