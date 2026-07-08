import { beforeEach, describe, expect, it } from 'vitest'
import { Alerta } from '../../../domain/alerta/alerta.entity.js'
import { Notificacao } from '../../../domain/notificacao/notificacao.entity.js'
import { ListarNotificacaoDoUsuarioMapper } from './listar-notificacao-do-usuario.mapper.js'

describe('ListarNotificacaoDoUsuarioMapper', () => {
  let notificacoes: Notificacao
  let alertas: Alerta

  beforeEach(() => {
    notificacoes = Notificacao.create('1', '1', '1', false)
    alertas = Alerta.create(
      '1',
      '1',
      '1',
      'dispositivo_inoperante',
      'aviso',
      'Dispositivo offline',
      true,
    )
  })

  it('deve extrair informações da notificação quando valido', () => {
    const mapper = ListarNotificacaoDoUsuarioMapper
    expect(mapper.paraOutput([notificacoes], [alertas])).toStrictEqual({
      notificoes: [
        {
          id: notificacoes.id,
          dispositivoId: alertas.dispositivoId,
          ambienteId: alertas.ambienteId,
          tipo: alertas.tipo,
          nivel: alertas.nivel,
          mensagem: alertas.mensagem,
          lida: notificacoes.lida,
          sensorTipo: undefined,
          valorAtual: undefined,
          limiteMin: undefined,
          limiteMax: undefined,
        },
      ],
    })
  })

  it('deve retornar uma exceção quando parametro for invalido', () => {
    const mapper = ListarNotificacaoDoUsuarioMapper
    expect(() => mapper.paraOutput(null as any, [alertas])).toThrow('Notificacoes invalidas')
    expect(() => mapper.paraOutput([notificacoes], null as any)).toThrow('Alertas invalidos')
  })
})
