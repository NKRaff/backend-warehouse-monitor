import { beforeEach, describe, expect, it } from 'vitest'
import { Autenticacao } from './autenticacao.entity.js'

describe('Autenticacao', () => {
  let autenticacao: Autenticacao

  beforeEach(() => {
    autenticacao = Autenticacao.create('auth-1', 'usuario-xyz', 'senhaSuperSegura123')
  })

  describe('Criação e Atributos', () => {
    it('deve ser instanciado com sucesso quando valores válidos forem fornecidos', () => {
      expect(autenticacao).toBeDefined()
      expect(autenticacao).toBeInstanceOf(Autenticacao)
    })

    it('deve retornar os atributos corretos através dos getters', () => {
      expect(autenticacao.id).toBe('auth-1')
      expect(autenticacao.usuarioId).toBe('usuario-xyz')
      expect(autenticacao.senha).toBe('senhaSuperSegura123')
    })
  })

  describe('Caminhos Ruins e Casos de Borda (Edge Cases)', () => {
    it('deve permitir strings vazias para id, usuário e senha', () => {
      const autenticacaoVazia = Autenticacao.create('', '', '')

      expect(autenticacaoVazia.id).toBe('')
      expect(autenticacaoVazia.usuarioId).toBe('')
      expect(autenticacaoVazia.senha).toBe('')
    })

    it('deve lidar com valores que quebram a tipagem em tempo de execução (Valores Nulos)', () => {
      const autenticacaoNula = Autenticacao.create(null as any, undefined as any, null as any)

      expect(autenticacaoNula.id).toBeNull()
      expect(autenticacaoNula.usuarioId).toBeUndefined()
      expect(autenticacaoNula.senha).toBeNull()
    })

    it('deve expor a senha em texto limpo (Plain Text)', () => {
      const senhaExposta = '123456'
      const auth = Autenticacao.create('auth-2', 'user-abc', senhaExposta)

      expect(auth.senha).toBe(senhaExposta)
      expect(auth.senha).not.toContain('******')
    })
  })
})
