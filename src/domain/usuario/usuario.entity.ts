export type UsuarioProps = {
  id: string
  nome: string
  email: string
  senha: string
}

export class Usuario {
  private constructor(private props: UsuarioProps) {}

  public static create(id: string, nome: string, email: string, senha: string) {
    return new Usuario({ id, nome, email, senha })
  }

  public get id(): string {
    return this.props.id
  }

  public get nome(): string {
    return this.props.nome
  }

  public get email(): string {
    return this.props.email
  }

  public get senha(): string {
    return this.props.senha
  }
}
