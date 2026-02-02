export type AtualizarAmbienteInputDto = {
  id: string
  nome?: string
  descricao?: string
  temperatura_minima?: number
  temperatura_maxima?: number
  umidade_minima?: number
  umidade_maxima?: number
}

export type AtualizarAmbienteOutputDto = {
  id: string
}
