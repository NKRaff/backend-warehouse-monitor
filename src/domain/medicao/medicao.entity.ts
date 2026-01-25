export type TipoMedicao = 'temperatura' | 'umidade'

export type MedicaoProps = {
  id: string
  dispositivoId: string
  ambienteId: string
  tipo: TipoMedicao
  valor: number
  createdAt: Date
  updatedAt: Date
}

export class Medicao {
  private constructor(private props: MedicaoProps) {}

  public static create(
    id: string,
    dispositivoId: string,
    ambienteId: string,
    tipo: TipoMedicao,
    valor: number,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    const now = new Date()
    return new Medicao({
      id,
      dispositivoId,
      ambienteId,
      tipo,
      valor,
      createdAt: createdAt || now,
      updatedAt: updatedAt || now,
    })
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

  public get tipo(): TipoMedicao {
    return this.props.tipo
  }

  public get valor(): number {
    return this.props.valor
  }

  public get createdAt(): Date {
    return this.props.createdAt
  }

  public get updatedAt(): Date {
    return this.props.updatedAt
  }
}
