import { beforeEach, describe, expect, it } from 'vitest'
import { Usuario } from './usuario.entity.js'

describe('Usuario', () => {
  let usuario: Usuario

  beforeEach(() => {
    usuario = Usuario.create('user-123', 'João Silva', 'joao@email.com', true)
  })

  describe('Criação e Atributos', () => {
    it('deve criar um usuário com todos os atributos fornecidos corretamente', () => {
      expect(usuario.id).toBe('user-123')
      expect(usuario.nome).toBe('João Silva')
      expect(usuario.email).toBe('joao@email.com')
      expect(usuario.receberEmail).toBe(true)
    })
  })

  describe('Método update', () => {
    it('deve atualizar todos os campos quando fornecidos', () => {
      usuario.update('João Souza', 'joaosouza@email.com', false)

      expect(usuario.nome).toBe('João Souza')
      expect(usuario.email).toBe('joaosouza@email.com')
      expect(usuario.receberEmail).toBe(false)
    })

    it('deve atualizar apenas o nome e manter os outros atributos intactos', () => {
      usuario.update('João alterado')

      expect(usuario.nome).toBe('João alterado')
      expect(usuario.email).toBe('joao@email.com')
      expect(usuario.receberEmail).toBe(true)
    })

    it('deve atualizar apenas o email e manter os outros atributos intactos', () => {
      usuario.update(undefined, 'novo@email.com')

      expect(usuario.nome).toBe('João Silva')
      expect(usuario.email).toBe('novo@email.com')
      expect(usuario.receberEmail).toBe(true)
    })

    it('deve alterar receberEmail para false via update respeitando a validação undefined', () => {
      expect(usuario.receberEmail).toBe(true)

      usuario.update(undefined, undefined, false)

      expect(usuario.receberEmail).toBe(false)
    })
  })

  describe('Gerenciamento de Preferência de E-mail', () => {
    it('deve desativar o recebimento de e-mail ao chamar desativarRecebimentoDeEmail', () => {
      expect(usuario.receberEmail).toBe(true)

      usuario.desativarRecebimentoDeEmail()

      expect(usuario.receberEmail).toBe(false)
    })

    it('deve ativar o recebimento de e-mail ao chamar ativarRecebimentoDeEmail', () => {
      const usuarioInativo = Usuario.create('user-456', 'Ana Costa', 'ana@email.com', false)
      expect(usuarioInativo.receberEmail).toBe(false)

      usuarioInativo.ativarRecebimentoDeEmail()

      expect(usuarioInativo.receberEmail).toBe(true)
    })
  })

  describe('Caminhos Ruins e Comportamentos Inesperados', () => {
    describe('Brechas no Método update com Parâmetros Falsy', () => {
      it('deve permitir a limpeza de campos para string vazia se o código usar checagem de tipo frouxa', () => {
        const nome = usuario.nome
        const email = usuario.email

        usuario.update('', '')

        expect(usuario.nome).toBe(nome)
        expect(usuario.email).toBe(email)
      })

      it('deve certificar que passar parâmetros nulos explicitamente não explode a entidade', () => {
        const nome = usuario.nome
        const email = usuario.email

        usuario.update(null as any, null as any)

        expect(usuario.nome).toBe(nome)
        expect(usuario.email).toBe(email)
      })
    })

    describe('Formato de Dados Frágil (Sem Validação de Domínio)', () => {
      it('deve aceitar emails estruturalmente inválidos tanto no create quanto no update', () => {
        const usuarioComEmailInvalido = Usuario.create(
          'user-999',
          'Invalido',
          'string-qualquer-sem-arroba',
          true,
        )
        expect(usuarioComEmailInvalido.email).toBe('string-qualquer-sem-arroba')

        usuarioComEmailInvalido.update(undefined, 'email_errado.com')
        expect(usuarioComEmailInvalido.email).toBe('email_errado.com')
      })
    })

    describe('Mutações Redundantes e Idempotência', () => {
      it('deve manter o estado inalterado e não disparar efeitos colaterais ao ativar ou desativar e-mails repetidamente', () => {
        usuario.ativarRecebimentoDeEmail()
        usuario.ativarRecebimentoDeEmail()

        expect(usuario.receberEmail).toBe(true)
        expect(usuario.nome).toBe('João Silva')

        usuario.desativarRecebimentoDeEmail()
        usuario.desativarRecebimentoDeEmail()

        expect(usuario.receberEmail).toBe(false)
        expect(usuario.email).toBe('joao@email.com')
      })
    })
  })
})
