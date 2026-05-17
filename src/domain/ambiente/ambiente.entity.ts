import { Alerta } from '../alerta/alerta.entity.js'
import type { Dispositivo } from '../dispositivo/dispositivo.entity.js'
import type { TipoMedicao } from '../medicao/medicao.entity.js'

export type TipoAmbiente = 'frio' | 'arejado'

export type AmbienteProps = {
  id: string
  nome: string
  tipo: TipoAmbiente
  descricao: string
  temperatura_minima: number
  temperatura_maxima: number
  umidade_minima: number
  umidade_maxima: number
}

export class Ambiente {
  private constructor(private props: AmbienteProps) {}

  public static create(
    id: string,
    nome: string,
    tipo: TipoAmbiente,
    temperatura_minima: number,
    temperatura_maxima: number,
    umidade_minima: number,
    umidade_maxima: number,
    descricao?: string,
  ) {
    return new Ambiente({
      id,
      nome,
      tipo,
      temperatura_minima,
      temperatura_maxima,
      umidade_minima,
      umidade_maxima,
      descricao: descricao || 'Sem descrição',
    })
  }

  public update(
    nome?: string,
    descricao?: string,
    temperatura_minima?: number,
    temperatura_maxima?: number,
    umidade_minima?: number,
    umidade_maxima?: number,
  ) {
    if (nome) this.props.nome = nome
    if (descricao) this.props.descricao = descricao
    this.atualizarRangeTemperatura(temperatura_minima, temperatura_maxima)
    this.atualizarRangeUmidade(umidade_minima, umidade_maxima)
  }

  private atualizarRangeTemperatura(temperatura_minima?: number, temperatura_maxima?: number) {
    const min =
      temperatura_minima !== undefined ? temperatura_minima : this.props.temperatura_minima
    const max =
      temperatura_maxima !== undefined ? temperatura_maxima : this.props.temperatura_maxima

    if (min >= max)
      throw new Error('Temperatura mínima não pode ser maior ou igual à temperatura máxima')

    if (temperatura_minima !== undefined) this.props.temperatura_minima = temperatura_minima
    if (temperatura_maxima !== undefined) this.props.temperatura_maxima = temperatura_maxima
  }

  private atualizarRangeUmidade(umidade_minima?: number, umidade_maxima?: number) {
    const min = umidade_minima !== undefined ? umidade_minima : this.props.umidade_minima
    const max = umidade_maxima !== undefined ? umidade_maxima : this.props.umidade_maxima

    if (min >= max) throw new Error('Umidade mínima não pode ser maior ou igual à umidade máxima')

    if (umidade_minima !== undefined) this.props.umidade_minima = umidade_minima
    if (umidade_maxima !== undefined) this.props.umidade_maxima = umidade_maxima
  }

  public validarMedicao(
    id: string,
    dispositivo: Dispositivo,
    tipo: TipoMedicao,
    valor: number,
  ): Alerta | null {
    let alerta: Alerta | null = null
    if (tipo === 'temperatura') {
      alerta = this.validarRange(
        id,
        dispositivo,
        valor,
        tipo,
        this.temperaturaMinima,
        this.temperaturaMaxima,
        'Valor de temperatura fora do limite esperado',
      )
    } else {
      alerta = this.validarRange(
        id,
        dispositivo,
        valor,
        tipo,
        this.umidadeMinima,
        this.umidadeMaxima,
        'Valor de umidade fora do limite esperado',
      )
    }
    return alerta
  }

  private validarRange(
    id: string,
    dispositivo: Dispositivo,
    valor: number,
    tipo: TipoMedicao,
    min: number,
    max: number,
    mensagem: string,
  ): Alerta | null {
    if (valor < min || valor > max) {
      return Alerta.create(
        id,
        dispositivo.id,
        this.id,
        'sensor_fora_do_range',
        'critico',
        mensagem,
        true,
        tipo,
        valor,
        min,
        max,
      )
    }
    return null
  }

  public get id(): string {
    return this.props.id
  }

  public get nome(): string {
    return this.props.nome
  }

  public get tipo(): TipoAmbiente {
    return this.props.tipo
  }

  public get descricao(): string {
    return this.props.descricao
  }

  public get temperaturaMinima(): number {
    return this.props.temperatura_minima
  }

  public get temperaturaMaxima(): number {
    return this.props.temperatura_maxima
  }

  public get umidadeMinima(): number {
    return this.props.umidade_minima
  }

  public get umidadeMaxima(): number {
    return this.props.umidade_maxima
  }
}
