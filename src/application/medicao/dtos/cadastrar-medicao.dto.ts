import type { TipoMedicao } from '@/domain/medicao/medicao.entity.js'

export type CadastrarMedicaoInputDto = {
  dispositivoId: string
  ambienteId: string
  tipo: TipoMedicao
  valor: number
}

export type CadastrarMedicaoOutputDto = {
  id: string
}
