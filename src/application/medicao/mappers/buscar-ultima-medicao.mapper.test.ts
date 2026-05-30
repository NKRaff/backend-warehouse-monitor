import { beforeEach, describe, expect, it } from 'vitest'
import { Medicao } from '../../../domain/medicao/medicao.entity.js'
import { BuscarUltimaMedicaoMapper } from './buscar-ultima-medicao.mapper.js'

describe('BuscarUltimaMedicaoMapper', () => {
  let medicao: Medicao

  beforeEach(() => {
    medicao = Medicao.create('1', '1', '1', 'temperatura', 50, new Date())
  })

  it('deve extrair informações de Medição quando valido', () => {
    const mapper = BuscarUltimaMedicaoMapper
    expect(mapper.paraOutput(medicao)).toStrictEqual({
      id: medicao.id,
      dispositivoId: medicao.dispositivoId,
      ambienteId: medicao.ambienteId,
      tipo: medicao.tipo,
      valor: medicao.valor,
      createdAt: medicao.createdAt,
      updatedAt: medicao.updatedAt,
    })
  })

  it('deve retornar uma exceção quando parametro for invalido', () => {
    const mapper = BuscarUltimaMedicaoMapper
    expect(() => mapper.paraOutput(null as any)).toThrow('Medição invalida')
  })
})
