import { beforeEach, describe, expect, it } from 'vitest'
import { Dispositivo } from './dispositivo.entity.js'

describe('Dispositivo', () => {
  let dispositivo: Dispositivo

  beforeEach(() => {
    dispositivo = Dispositivo.create('disp-123', 'Sensor Termômetro', 'amb-999')
  })

  describe('Criação e Atributos', () => {
    it('deve criar um dispositivo com todos os atributos fornecidos', () => {
      expect(dispositivo.id).toBe('disp-123')
      expect(dispositivo.nome).toBe('Sensor Termômetro')
      expect(dispositivo.ambienteId).toBe('amb-999')
    })

    it('deve permitir a criação de um dispositivo opcionalmente apenas com o ID', () => {
      const dispMinimo = Dispositivo.create('disp-000')

      expect(dispMinimo.id).toBe('disp-000')
      expect(dispMinimo.nome).toBeUndefined()
      expect(dispMinimo.ambienteId).toBeUndefined()
    })
  })

  describe('Método update', () => {
    it('deve atualizar o nome e o ambienteId quando ambos forem informados', () => {
      dispositivo.update('Novo Nome Sensor', 'amb-777')

      expect(dispositivo.nome).toBe('Novo Nome Sensor')
      expect(dispositivo.ambienteId).toBe('amb-777')
    })

    it('deve atualizar o nome mas resetar o ambienteId para string vazia se o ambienteId for omitido', () => {
      dispositivo.update('Apenas Nome Atualizado', undefined)

      expect(dispositivo.nome).toBe('Apenas Nome Atualizado')
      expect(dispositivo.ambienteId).toBe('')
    })

    it('deve manter o nome intacto se for undefined, mas ainda assim resetar o ambienteId', () => {
      dispositivo.update(undefined, undefined)

      expect(dispositivo.nome).toBe('Sensor Termômetro')
      expect(dispositivo.ambienteId).toBe('')
    })
  })

  describe('Método removerAmbiente', () => {
    it('deve definir o ambienteId como undefined com sucesso', () => {
      expect(dispositivo.ambienteId).toBe('amb-999')

      dispositivo.removerAmbiente()

      expect(dispositivo.ambienteId).toBeUndefined()
    })
  })

  describe('Caminhos Ruins e Efeitos Colaterais', () => {
    describe('Efeitos Colaterais Destrutivos do Método update', () => {
      it('deve documentar a perda indesejada do ambienteId ao atualizar APENAS o nome', () => {
        expect(dispositivo.ambienteId).toBe('amb-999')

        dispositivo.update('Nome Atualizado Sem Mexer No Ambiente')

        expect(dispositivo.nome).toBe('Nome Atualizado Sem Mexer No Ambiente')
        expect(dispositivo.ambienteId).toBe('')
        expect(dispositivo.ambienteId).not.toBe('amb-999')
      })
    })

    describe('Inconsistência de Tipos de Reset (String Vazia vs Undefined)', () => {
      it('deve evidenciar que o estado de "sem ambiente" assume tipos diferentes dependendo do método chamado', () => {
        dispositivo.removerAmbiente()
        const estadoViaRemover = dispositivo.ambienteId

        const outroDispositivo = Dispositivo.create('disp-777', 'Sensor B', 'amb-1')
        outroDispositivo.update(undefined, undefined)
        const estadoViaUpdate = outroDispositivo.ambienteId

        expect(estadoViaRemover).toBeUndefined()
        expect(estadoViaUpdate).toBe('')
        expect(estadoViaRemover).not.toEqual(estadoViaUpdate)
      })
    })

    describe('Entradas Vazias e Espaços em Branco', () => {
      it('deve aceitar strings vazias ou nulas em tempo de execução para o id', () => {
        const dispositivoInvalido = Dispositivo.create('   ', '', null as any)

        expect(dispositivoInvalido.id).toBe('   ')
        expect(dispositivoInvalido.nome).toBe('')
        expect(dispositivoInvalido.ambienteId).toBeNull()
      })
    })
  })
})
