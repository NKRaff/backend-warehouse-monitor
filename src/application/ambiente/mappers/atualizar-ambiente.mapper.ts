import type { Ambiente } from '@/domain/ambiente/ambiente.entity.js'

export namespace AtualizarAmbienteMapper {
  export function paraOutput(ambiente: Ambiente) {
    return {
      id: ambiente.id,
    }
  }
}
