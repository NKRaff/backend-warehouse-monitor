import type { Dispositivo } from '@/domain/dispositivo/dispositivo.entity.js'

export namespace CadastrarDispositivoMapper {
  export function paraOutput(dispositivo: Dispositivo) {
    if (!dispositivo) {
      throw new Error('Dispositivo invalido')
    }
    return {
      id: dispositivo.id,
    }
  }
}
