export type TipoAmbiente = 'frio' | 'arejado'

export type AmbienteProps = {
  id: string
  nome: string
  tipo: TipoAmbiente
  descricao: string
}

export class Ambiente {
  private constructor(private props: AmbienteProps) {}

  public static create(id: string, nome: string, tipo: TipoAmbiente, descricao?: string) {
    return new Ambiente({ id, nome, tipo, descricao: descricao || 'Sem descrição' })
  }

  public get id(): string {
    return this.props.id
  }

  public get nome(): string {
    return this.props.nome
  }

  public get tipo(): string {
    return this.props.tipo
  }

  public get descricao(): string {
    return this.props.descricao
  }
}
