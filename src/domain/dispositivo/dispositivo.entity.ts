export type DispositivoProps = {
  id: string
  nome?: string
  ambienteId?: string
}

export class Dispositivo {
  private constructor(private props: DispositivoProps) {}

  public static create(id: string, nome?: string, ambienteId?: string) {
    return new Dispositivo({ id, nome, ambienteId })
  }

  public update(nome?: string, ambienteId?: string) {
    if (nome) this.props.nome = nome
    if (ambienteId) this.props.ambienteId = ambienteId
  }

  public removerAmbiente() {
    this.props.ambienteId = undefined
  }

  public get id(): string {
    return this.props.id
  }

  public get nome() {
    return this.props.nome
  }

  public get ambienteId() {
    return this.props.ambienteId
  }
}
