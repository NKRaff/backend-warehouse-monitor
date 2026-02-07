export type ListarDispositivosInputDto = void

export type ListarDispositivosOutputDto = {
  dispositivos: {
    id: string
    nome?: string
    ambienteId?: string
  }[]
}
