export type AutenticacaoProps = {
  id: string
  usuarioId: string
  senha: string
}

export class Autenticacao {
  private constructor(private props: AutenticacaoProps) {}

  public static create(id: string, usuarioId: string, senha: string) {
    return new Autenticacao({ id, usuarioId, senha })
  }

  public get id(): string {
    return this.props.id
  }

  public get usuarioId(): string {
    return this.props.usuarioId
  }

  public get senha(): string {
    return this.props.senha
  }
}
