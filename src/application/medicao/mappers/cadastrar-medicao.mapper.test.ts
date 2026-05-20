import { beforeEach, describe, expect, it } from 'vitest'
import { Medicao } from '../../../domain/medicao/medicao.entity.js'
import { CadastrarMedicaoMapper } from './cadastrar-medicao.mapper.js'

describe('CadastrarMedicaoMapper', () => {
  let medicao: Medicao

  beforeEach(() => {
    medicao = Medicao.create('1', '1', '1', 'temperatura', 50, new Date())
  })

  it('deve extrair informações da Medicao quando valido', () => {
    const mapper = CadastrarMedicaoMapper
    expect(mapper.paraOutput(medicao)).toStrictEqual({ id: '1' })
  })

  it('deve retornar uma exceção quando parametro for invalido', () => {
    const mapper = CadastrarMedicaoMapper
    expect(() => mapper.paraOutput(null as any)).toThrow('Dispositivo invalido')
  })
})
