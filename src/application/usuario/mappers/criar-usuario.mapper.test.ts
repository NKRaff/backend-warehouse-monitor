import { beforeEach, describe, expect, it } from 'vitest'
import { Usuario } from '../../../domain/usuario/usuario.entity.js'
import { CriarUsuarioMapper } from './criar-usuario.mapper.js'

describe('CriarUsuarioMapper', () => {
  let usuario: Usuario

  beforeEach(() => {
    usuario = Usuario.create('1', 'Maria', 'maria@email.com', false)
  })

  it('deve extrair o id do Usuario quando valido', () => {
    const mapper = CriarUsuarioMapper
    expect(mapper.paraOutput(usuario)).toStrictEqual({ id: '1' })
  })

  it('deve retornar uma exceção quando parametro for invalido', () => {
    const mapper = CriarUsuarioMapper
    expect(() => mapper.paraOutput(null as any)).toThrow('Usuario invalido')
  })
})
