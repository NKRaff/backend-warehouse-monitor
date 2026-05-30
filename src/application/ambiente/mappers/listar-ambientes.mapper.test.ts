import { beforeEach, describe, expect, it } from 'vitest'
import { Ambiente } from '../../../domain/ambiente/ambiente.entity.js'
import { ListarAmbientesMapper } from './listar-ambientes.mapper.js'

describe('ListarAmbientesMapper', () => {
  let ambiente: Ambiente

  beforeEach(() => {
    ambiente = Ambiente.create('1', 'geladeira', 'frio', 5, 15, 50, 80)
  })

  it('deve extrair o id do Ambiente quando valido', () => {
    const mapper = ListarAmbientesMapper
    expect(mapper.paraOutput([ambiente])).toStrictEqual({
      ambientes: [
        {
          id: '1',
          nome: 'geladeira',
          tipo: 'frio',
          descricao: 'Sem descrição',
          temperatura_minima: 5,
          temperatura_maxima: 15,
          umidade_minima: 50,
          umidade_maxima: 80,
        },
      ],
    })
  })

  it('deve retornar uma exceção quando parametro for invalido', () => {
    const mapper = ListarAmbientesMapper
    expect(() => mapper.paraOutput(null as any)).toThrow('Lista de Ambiente invalido')
  })
})
