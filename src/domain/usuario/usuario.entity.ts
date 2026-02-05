export type UsuarioProps = {
  id: string
  nome: string
  email: string
  receberEmail: boolean
}

export class Usuario {
  private constructor(private props: UsuarioProps) {}

  public static create(id: string, nome: string, email: string, receberEmail: boolean) {
    return new Usuario({ id, nome, email, receberEmail })
  }

  public update(nome?: string, email?: string, receberEmail?: boolean) {
    if (nome) this.props.nome = nome
    if (email) this.props.email = email
    if (receberEmail) this.props.receberEmail = receberEmail
  }

  public ativarRecebimentoDeEmail() {
    this.props.receberEmail = true
  }

  public desativarRecebimentoDeEmail() {
    this.props.receberEmail = false
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

  public get receberEmail(): boolean {
    return this.props.receberEmail
  }
}
