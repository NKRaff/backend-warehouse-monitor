import type { Ambiente } from '@/domain/ambiente/ambiente.entity.js'

export namespace CriarAmbienteMapper {
  export function paraOutput(ambiente: Ambiente) {
    return {
      id: ambiente.id,
    }
  }
}
