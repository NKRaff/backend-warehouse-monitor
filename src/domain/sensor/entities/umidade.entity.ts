export type UmidadeProps = {
  id: string
  umidade: string
}

export class Umidade {
  private constructor(private props: UmidadeProps) {}

  public static create(id: string, umidade: string) {
    return new Umidade({ id, umidade })
  }

  public get id(): string {
    return this.props.id
  }

  public get umidade(): string {
    return this.props.umidade
  }
}
