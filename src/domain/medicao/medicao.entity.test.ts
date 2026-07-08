import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Medicao } from './medicao.entity.js'

describe('Medicao', () => {
  describe('Criação com Valores Explícitos', () => {
    it('deve criar uma medição com todos os atributos e datas fornecidos manualmente', () => {
      const dataCriacao = new Date('2026-01-01T10:00:00Z')
      const dataAtualizacao = new Date('2026-01-02T15:30:00Z')

      const medicao = Medicao.create(
        'med-123',
        'disp-456',
        'amb-789',
        'temperatura',
        23.5,
        dataCriacao,
        dataAtualizacao,
      )

      expect(medicao.id).toBe('med-123')
      expect(medicao.dispositivoId).toBe('disp-456')
      expect(medicao.ambienteId).toBe('amb-789')
      expect(medicao.tipo).toBe('temperatura')
      expect(medicao.valor).toBe(23.5)
      expect(medicao.createdAt).toBe(dataCriacao)
      expect(medicao.updatedAt).toBe(dataAtualizacao)
    })

    it('deve aceitar o tipo umidade corretamente', () => {
      const medicaoUmidade = Medicao.create('med-124', 'disp-456', 'amb-789', 'umidade', 65)

      expect(medicaoUmidade.tipo).toBe('umidade')
      expect(medicaoUmidade.valor).toBe(65)
    })
  })

  describe('Criação com Datas Padrão (Fallback)', () => {
    const dataSimulada = new Date('2026-05-18T12:00:00Z')

    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(dataSimulada)
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('deve definir createdAt e updatedAt com a data atual se omitidos', () => {
      const medicao = Medicao.create('med-999', 'disp-456', 'amb-789', 'temperatura', 19)

      expect(medicao.createdAt).toEqual(dataSimulada)
      expect(medicao.updatedAt).toEqual(dataSimulada)
    })
  })

  describe('Caminhos Ruins e Dados Corrompidos de Hardware', () => {
    describe('Valores Numéricos Extremos e Incoerentes', () => {
      it('deve permitir leituras físicas impossíveis do sensor (Ex: Umidade Negativa)', () => {
        const medicaoCorrompida = Medicao.create('med-err', 'disp-1', 'amb-1', 'umidade', -15.5)

        expect(medicaoCorrompida.valor).toBe(-15.5)
      })

      it('deve aceitar o valor zero normalmente sem que a lógica trate-o como nulo/falsy', () => {
        const medicaoZero = Medicao.create('med-zero', 'disp-1', 'amb-1', 'temperatura', 0)

        expect(medicaoZero.valor).toBe(0)
      })
    })

    describe('Inconsistências de Tempo (Cronologia Invertida)', () => {
      it('deve aceitar uma data de atualização anterior à data de criação', () => {
        const dataFutura = new Date('2026-12-31T23:59:59Z')
        const dataPassada = new Date('2026-01-01T00:00:00Z')

        const medicaoAnocronica = Medicao.create(
          'med-time',
          'disp-1',
          'amb-1',
          'temperatura',
          20,
          dataFutura,
          dataPassada,
        )

        expect(medicaoAnocronica.createdAt).toBe(dataFutura)
        expect(medicaoAnocronica.updatedAt).toBe(dataPassada)
      })
    })

    describe('Quebra de Contrato de Tipos em Tempo de Execução', () => {
      it('deve aceitar tipos de medição inválidos fora do contrato do TypeScript', () => {
        const medicaoTipoInvalido = Medicao.create(
          'med-invalid-type',
          'disp-1',
          'amb-1',
          'pressao' as any,
          300,
        )

        expect(medicaoTipoInvalido.tipo).toBe('pressao')
      })
    })
  })
})
