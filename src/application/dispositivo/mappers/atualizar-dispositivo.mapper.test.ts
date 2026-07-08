import { beforeEach, describe, expect, it } from 'vitest'
import { Dispositivo } from '../../../domain/dispositivo/dispositivo.entity.js'
import { AtualizarDispositivoMapper } from './atualizar-dispositivo.mapper.js'

describe('AtualizarDispositivoMapper', () => {
  let dispositivo: Dispositivo

  beforeEach(() => {
    dispositivo = Dispositivo.create('1', 'dispositivo', '1')
  })

  it('deve extrair informações do Dispositivo quando valido', () => {
    const mapper = AtualizarDispositivoMapper
    expect(mapper.paraOutput(dispositivo)).toStrictEqual({ id: '1', ambienteId: '1' })
  })

  it('deve retornar uma exceção quando parametro for invalido', () => {
    const mapper = AtualizarDispositivoMapper
    expect(() => mapper.paraOutput(null as any)).toThrow('Dispositivo invalido')
  })
})
