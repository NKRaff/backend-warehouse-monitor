import { beforeEach, describe, expect, it } from 'vitest'
import { Usuario } from '../../../domain/usuario/usuario.entity.js'
import { BuscarUsuarioMapper } from './buscar-usuario.mapper.js'

describe('BuscarUsuarioMapper', () => {
  let usuario: Usuario

  beforeEach(() => {
    // Criando um usuário de exemplo para os testes
    usuario = Usuario.create('1', 'Maria', 'maria@email.com', false)
  })

  it('deve extrair todos os dados do Usuario para o output quando valido', () => {
    const mapper = BuscarUsuarioMapper

    expect(mapper.paraOutput(usuario)).toStrictEqual({
      id: '1',
      nome: 'Maria',
      email: 'maria@email.com',
      receberEmail: false,
    })
  })

  it('deve retornar uma exceção quando parametro for invalido', () => {
    const mapper = BuscarUsuarioMapper

    expect(() => mapper.paraOutput(null as any)).toThrow('Usuario invalido')
  })
})
