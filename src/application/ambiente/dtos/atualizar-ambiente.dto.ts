import type { TipoAmbiente } from '../../../domain/ambiente/ambiente.entity.js'

export type AtualizarAmbienteInputDto = {
  id: string
  nome?: string
  tipo?: TipoAmbiente
  descricao?: string
  temperatura_minima?: number
  temperatura_maxima?: number
  umidade_minima?: number
  umidade_maxima?: number
}

export type AtualizarAmbienteOutputDto = {
  id: string
}
