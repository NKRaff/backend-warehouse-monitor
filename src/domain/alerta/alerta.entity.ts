import type { TipoMedicao } from '../medicao/medicao.entity.js'

export type TipoAlerta = 'sensor_fora_do_range' | 'dispositivo_inoperante'
export type NivelAlerta = 'aviso' | 'critico'

export type AlertaProps = {
  id: string
  dispositivoId: string
  ambienteId: string

  tipo: TipoAlerta
  nivel: NivelAlerta

  mensagem: string
  ativo: boolean

  sensorTipo?: TipoMedicao
  valorAtual?: number
  limiteMin?: number
  limiteMax?: number
}

export class Alerta {
  private constructor(private props: AlertaProps) {}

  public static create(
    id: string,
    dispositivoId: string,
    ambienteId: string,
    tipo: TipoAlerta,
    nivel: NivelAlerta,
    mensagem: string,
    ativo: boolean,
    sensorTipo?: TipoMedicao,
    valorAtual?: number,
    limiteMin?: number,
    limiteMax?: number,
  ) {
    return new Alerta({
      id,
      dispositivoId,
      ambienteId,
      tipo,
      nivel,
      mensagem,
      ativo,
      sensorTipo,
      valorAtual,
      limiteMin,
      limiteMax,
    })
  }

  public encerrar() {
    this.props.ativo = false
  }

  public ativar() {
    this.props.ativo = true
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

  public get tipo(): TipoAlerta {
    return this.props.tipo
  }

  public get nivel(): NivelAlerta {
    return this.props.nivel
  }

  public get mensagem(): string {
    return this.props.mensagem
  }

  public get ativo(): boolean {
    return this.props.ativo
  }

  public get sensorTipo(): TipoMedicao | unknown {
    return this.props.sensorTipo
  }

  public get valorAtual(): number | unknown {
    return this.props.valorAtual
  }

  public get limiteMin(): number | unknown {
    return this.props.limiteMin
  }

  public get limiteMax(): number | unknown {
    return this.props.limiteMax
  }
}
