export type CriarUsuarioInputDto = {
  nome: string
  email: string
  senha: string
  receberEmail: boolean
}

export type CriarUsuarioOutputDto = {
  id: string
}
