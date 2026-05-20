import { beforeEach, describe, expect, it } from 'vitest'
import { Usuario } from '../../../domain/usuario/usuario.entity.js'
import { AtualizarUsuarioMapper } from './atualizar-usuario.mapper.js'

describe('AtualizarUsuarioMapper', () => {
  let usuario: Usuario

  beforeEach(() => {
    usuario = Usuario.create('1', 'Maria', 'maria@email.com', false)
  })

  it('deve extrair o id do Usuario quando valido', () => {
    const mapper = AtualizarUsuarioMapper
    expect(mapper.paraOutput(usuario)).toStrictEqual({ id: '1' })
  })

  it('deve retornar uma exceção quando parametro for invalido', () => {
    const mapper = AtualizarUsuarioMapper
    expect(() => mapper.paraOutput(null as any)).toThrow('Ambiente invalido')
  })
})
