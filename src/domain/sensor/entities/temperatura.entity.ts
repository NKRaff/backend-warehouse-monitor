export type TemperaturaProps = {
  id: string
  temperatura: string
}

export class Temperatura {
  private constructor(private props: TemperaturaProps) {}

  public static create(id: string, temperatura: string) {
    return new Temperatura({ id, temperatura })
  }

  public get id(): string {
    return this.props.id
  }

  public get temperatura(): string {
    return this.props.temperatura
  }
}
