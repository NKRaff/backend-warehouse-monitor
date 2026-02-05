export type AtualizarUsuarioInputDto = {
  id: string
  nome?: string
  email?: string
  receberEmail?: boolean
}

export type AtualizarUsuarioOutputDto = {
  id: string
}
