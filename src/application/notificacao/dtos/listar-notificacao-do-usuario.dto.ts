import type { NivelAlerta, TipoAlerta } from '../../../domain/alerta/alerta.entity.js'
import type { TipoMedicao } from '../../../domain/medicao/medicao.entity.js'

export type ListarNotificacaoDoUsuarioInputDto = {
  usuarioId: string
}

export type ListarNotificacaoDoUsuarioOutputDto = {
  notificoes: {
    id: string
    dispositivoId: string
    ambienteId: string
    tipo: TipoAlerta
    nivel: NivelAlerta
    mensagem: string
    sensorTipo?: TipoMedicao
    valorAtual?: number
    limiteMin?: number
    limiteMax?: number
    lida: boolean
  }[]
}
