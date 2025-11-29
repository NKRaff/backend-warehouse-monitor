export type ListarAmbientesInputDto = void

export type ListarAmbientesOutputDto = {
  ambientes: {
    id: string
    nome: string
    tipo: string
    descricao: string
  }[]
}
