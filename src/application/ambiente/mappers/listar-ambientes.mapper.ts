import type { Ambiente } from '../../../domain/ambiente/ambiente.entity.js'

export namespace ListarAmbientesMapper {
  export function paraOutput(ambientes: Ambiente[]) {
    if (!ambientes) {
      throw new Error('Lista de Ambiente invalido')
    }
    return {
      ambientes: ambientes.map((ambiente) => {
        return {
          id: ambiente.id,
          nome: ambiente.nome,
          tipo: ambiente.tipo,
          descricao: ambiente.descricao,
          temperatura_minima: ambiente.temperaturaMinima,
          temperatura_maxima: ambiente.temperaturaMaxima,
          umidade_minima: ambiente.umidadeMinima,
          umidade_maxima: ambiente.umidadeMaxima,
        }
      }),
    }
  }
}
