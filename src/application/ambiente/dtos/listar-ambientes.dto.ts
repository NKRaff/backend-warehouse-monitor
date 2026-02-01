export type ListarAmbientesInputDto = void

export type ListarAmbientesOutputDto = {
  ambientes: {
    id: string
    nome: string
    tipo: string
    descricao: string
    temperatura_minima: number
    temperatura_maxima: number
    umidade_minima: number
    umidade_maxima: number
  }[]
}
