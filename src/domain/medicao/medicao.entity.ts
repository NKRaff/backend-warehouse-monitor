export type TipoMedicao = 'temperatura' | 'umidade'

export type MedicaoProps = {
  id: string
  dispositivoId: string
  ambienteId: string
  tipo: TipoMedicao
  valor: number
}

export class Medicao {
  private constructor(private props: MedicaoProps) {}

  public static create(
    id: string,
    dispositivoId: string,
    ambienteId: string,
    tipo: TipoMedicao,
    valor: number,
  ) {
    return new Medicao({ id, dispositivoId, ambienteId, tipo, valor })
  }

  public get id(): string {
    return this.props.id
  }

  public get dispositivoId(): string {
    return this.props.dispositivoId
  }

  public get ambienteId(): string {
    return this.props.ambienteId
  }

  public get tipo(): string {
    return this.props.tipo
  }

  public get valor(): number {
    return this.props.valor
  }
}
