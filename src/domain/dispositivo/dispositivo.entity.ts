export type DispositivoProps = {
  id: string
  nome: string
  ambienteId: string
}

export class Dispositivo {
  private constructor(private props: DispositivoProps) {}

  public static create(id: string, nome: string, ambienteId: string) {
    return new Dispositivo({ id, nome, ambienteId })
  }

  public get id(): string {
    return this.props.id
  }

  public get nome(): string {
    return this.props.nome
  }

  public get ambienteId(): string {
    return this.props.ambienteId
  }
}
