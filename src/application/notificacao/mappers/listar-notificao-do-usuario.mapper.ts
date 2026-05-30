import type { Alerta } from '../../../domain/alerta/alerta.entity.js'
import type { Notificacao } from '../../../domain/notificacao/notificacao.entity.js'

export namespace ListarNotificacaoDoUsuarioMapper {
  export function paraOutput(notificacoes: Notificacao[], alertas: Alerta[]) {
    if (!notificacoes) {
      throw new Error('Notificacoes invalidas')
    } else if (!alertas) {
      throw new Error('Alertas invalidos')
    }
    return {
      notificoes: notificacoes
        .map((notificao, index) => {
          const alerta = alertas[index]
          return {
            id: notificao.id,
            dispositivoId: alerta.dispositivoId,
            ambienteId: alerta.ambienteId,
            tipo: alerta.tipo,
            nivel: alerta.nivel,
            mensagem: alerta.mensagem,
            sensorTipo: alerta.sensorTipo,
            valorAtual: alerta.valorAtual,
            limiteMin: alerta.limiteMin,
            limiteMax: alerta.limiteMax,
            lida: notificao.lida,
          }
        })
        .filter(Boolean),
    }
  }
}
