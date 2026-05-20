import { beforeEach, describe, expect, it } from 'vitest'
import { Medicao } from '../../../domain/medicao/medicao.entity.js'
import { BuscarMedicoesMapper } from './buscar-medicoes.mapper.js'

describe('ListarDispositivoMapper', () => {
  let medicao: Medicao

  beforeEach(() => {
    medicao = Medicao.create('1', '1', '1', 'temperatura', 50, new Date())
  })

  it('deve extrair informações de Medição quando valido', () => {
    const mapper = BuscarMedicoesMapper
    expect(mapper.paraOutput([medicao])).toStrictEqual({
      medicoes: [
        {
          id: medicao.id,
          dispositivoId: medicao.dispositivoId,
          ambienteId: medicao.ambienteId,
          tipo: medicao.tipo,
          valor: medicao.valor,
          createdAt: medicao.createdAt,
          updatedAt: medicao.updatedAt,
        },
      ],
    })
  })

  it('deve retornar uma exceção quando parametro for invalido', () => {
    const mapper = BuscarMedicoesMapper
    expect(() => mapper.paraOutput(null as any)).toThrow('Medição invalida')
  })
})
