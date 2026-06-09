import { beforeEach, describe, expect, it } from 'vitest'
import { Dispositivo } from '../../../domain/dispositivo/dispositivo.entity.js'
import { ListarDispositivosMapper } from './listar-dispositivos.mappers.js'

describe('ListarDispositivosMapper', () => {
  let dispositivo: Dispositivo

  beforeEach(() => {
    dispositivo = Dispositivo.create('1', 'dispositivo', '1')
  })

  it('deve extrair o id do Ambiente quando valido', () => {
    const mapper = ListarDispositivosMapper
    expect(mapper.paraOutput([dispositivo])).toStrictEqual({
      dispositivos: [
        {
          id: '1',
          nome: 'dispositivo',
          ambienteId: '1',
        },
      ],
    })
  })

  it('deve retornar uma exceção quando parametro for invalido', () => {
    const mapper = ListarDispositivosMapper
    expect(() => mapper.paraOutput(null as any)).toThrow('Lista de Dispositivo invalido')
  })
})
