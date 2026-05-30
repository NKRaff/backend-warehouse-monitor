import type { TipoMedicao } from '../../../domain/medicao/medicao.entity.js'

export type BuscarUltimaMedicaoInputDto = {
  dispositivoId?: string
  ambienteId?: string
  tipo: TipoMedicao
}

export type BuscarUltimaMedicaoOutputDto = {
  id: string
  dispositivoId: string
  ambienteId: string
  tipo: TipoMedicao
  valor: number
  createdAt: Date
  updatedAt: Date
}
