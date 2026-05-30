import { beforeEach, describe, expect, it } from 'vitest'
import { Ambiente } from '../../../domain/ambiente/ambiente.entity.js'
import { CriarAmbienteMapper } from './criar-ambiente.mapper.js'

describe('CriarAmbienteMapper', () => {
  let ambiente: Ambiente

  beforeEach(() => {
    ambiente = Ambiente.create('1', 'geladeira', 'frio', 5, 15, 50, 80)
  })

  it('deve extrair o id do Ambiente quando valido', () => {
    const mapper = CriarAmbienteMapper
    expect(mapper.paraOutput(ambiente)).toStrictEqual({ id: '1' })
  })

  it('deve retornar uma exceção quando parametro for invalido', () => {
    const mapper = CriarAmbienteMapper
    expect(() => mapper.paraOutput(null as any)).toThrow('Ambiente invalido')
  })
})
