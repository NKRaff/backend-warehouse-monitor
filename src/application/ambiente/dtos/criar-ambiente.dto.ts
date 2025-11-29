import type { TipoAmbiente } from '@/domain/ambiente/ambiente.entity.js'

export type CriarAmbienteInputDto = {
  nome: string
  tipo: TipoAmbiente
  descricao?: string
}

export type CriarAmbienteOutputDto = {
  id: string
}
