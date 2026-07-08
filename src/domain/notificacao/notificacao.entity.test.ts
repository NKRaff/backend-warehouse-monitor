import { beforeEach, describe, expect, it } from 'vitest'
import { Notificacao } from './notificacao.entity.js'

describe('Notificacao', () => {
  let notificacaoNova: Notificacao

  beforeEach(() => {
    notificacaoNova = Notificacao.create('notif-123', 'alerta-999', 'user-555')
  })

  describe('Criação e Atributos Padrão', () => {
    it('deve criar uma notificação com os valores corretos e "lida" como false por padrão', () => {
      expect(notificacaoNova.id).toBe('notif-123')
      expect(notificacaoNova.alertaId).toBe('alerta-999')
      expect(notificacaoNova.usuarioId).toBe('user-555')
      expect(notificacaoNova.lida).toBe(false)
    })

    it('deve aceitar explicitamente o valor true para o atributo "lida"', () => {
      const notificacaoLida = Notificacao.create('notif-124', 'alerta-999', 'user-555', true)

      expect(notificacaoLida.lida).toBe(true)
    })

    it('deve definir "lida" como false se o valor passado for null', () => {
      const notificacaoVazia = Notificacao.create('notif-125', 'alerta-999', 'user-555')
      const notificacaoComNull = Notificacao.create(
        'notif-125',
        'alerta-999',
        'user-555',
        null as any,
      )

      expect(notificacaoVazia.lida).toBe(false)
      expect(notificacaoComNull.lida).toBe(false)
    })
  })

  describe('Modificação de Estado', () => {
    it('deve alterar o status "lida" para true ao chamar marcarComoLida', () => {
      expect(notificacaoNova.lida).toBe(false)

      notificacaoNova.marcarComoLida()

      expect(notificacaoNova.lida).toBe(true)
    })

    it('deve manter o status "lida" como true se marcarComoLida for chamado mais de uma vez', () => {
      notificacaoNova.marcarComoLida()
      expect(notificacaoNova.lida).toBe(true)

      notificacaoNova.marcarComoLida()
      expect(notificacaoNova.lida).toBe(true)
    })
  })

  describe('Caminhos Ruins e Casos de Borda (Edge Cases)', () => {
    describe('Valores Nulos e Indefinidos em Tempo de Execução', () => {
      it('deve garantir que o getter de lida retorne false mesmo se a propriedade interna for corrompida para undefined', () => {
        const notificacaoCorrompida = Notificacao.create(
          'notif-err',
          'alerta-1',
          'user-1',
          undefined,
        )

        delete (notificacaoCorrompida as any).props.lida

        expect(notificacaoCorrompida.lida).toBe(false)
      })

      it('deve garantir que o getter de lida retorne false mesmo se a propriedade interna for corrompida para null', () => {
        const notificacaoCorrompida = Notificacao.create(
          'notif-err',
          'alerta-1',
          'user-1',
          null as any,
        )

        expect(notificacaoCorrompida.lida).toBe(false)
      })
    })

    describe('Ausência de Validação de Relacionamentos (Strings Vazias)', () => {
      it('deve permitir criar notificações sem vínculos reais (IDs vazios)', () => {
        const notificacaoOrfa = Notificacao.create(' ', '', '   ')

        expect(notificacaoOrfa.id).toBe(' ')
        expect(notificacaoOrfa.alertaId).toBe('')
        expect(notificacaoOrfa.usuarioId).toBe('   ')
      })
    })
  })
})
