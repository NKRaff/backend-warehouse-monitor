import type { TipoMedicao } from '../../../domain/medicao/medicao.entity.js'

export type BuscarMedicoesInputDto = {
  dispositivoId?: string
  ambienteId?: string
  tipo?: TipoMedicao
  minValor?: number
  maxValor?: number
  startData?: Date
  endData?: Date
}

export type BuscarMedicoesOutputDto = {
  medicoes: {
    id: string
    dispositivoId: string
    ambienteId: string
    tipo: TipoMedicao
    valor: number
    createdAt: Date
    updatedAt: Date
  }[]
}
