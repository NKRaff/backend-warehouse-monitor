import type { Ambiente } from '@/domain/ambiente/ambiente.entity.js'

export namespace ListarAmbientesMapper {
  export function paraOutput(ambientes: Ambiente[]) {
    return {
      ambientes: ambientes.map((ambiente) => {
        return {
          id: ambiente.id,
          nome: ambiente.nome,
          tipo: ambiente.tipo,
          descricao: ambiente.descricao,
        }
      }),
    }
  }
}
