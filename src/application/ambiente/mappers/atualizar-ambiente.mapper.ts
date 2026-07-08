import type { Ambiente } from '../../../domain/ambiente/ambiente.entity.js'

export namespace AtualizarAmbienteMapper {
  export function paraOutput(ambiente: Ambiente) {
    if (!ambiente) {
      throw new Error('Ambiente invalido')
    }
    return {
      id: ambiente.id,
    }
  }
}
