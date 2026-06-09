import type { TipoAmbiente } from '../../../domain/ambiente/ambiente.entity.js'

export type CriarAmbienteInputDto = {
  nome: string
  tipo: TipoAmbiente
  descricao?: string
  temperatura_minima: number
  temperatura_maxima: number
  umidade_minima: number
  umidade_maxima: number
}

export type CriarAmbienteOutputDto = {
  id: string
}
