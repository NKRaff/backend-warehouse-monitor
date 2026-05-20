import type { Ambiente } from '@/domain/ambiente/ambiente.entity.js'

export namespace CriarAmbienteMapper {
  export function paraOutput(ambiente: Ambiente) {
    if (!ambiente) {
      throw new Error('Ambiente invalido')
    }
    return {
      id: ambiente.id,
    }
  }
}
