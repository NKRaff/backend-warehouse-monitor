import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AutenticacaoRepository } from '../../../domain/autenticacao/autenticacao.repository.js'
import type { UsuarioRepository } from '../../../domain/usuario/usuario.repository.js'
import type { LogarInputDto } from '../dtos/logar.dto.js'
import { LogarUseCase } from './logar.usecase.js' // Ajuste o caminho se necessário

// 1. Mockando as dependências de criptografia e token externo
vi.mock('bcrypt', () => ({
  compare: vi.fn().mockResolvedValue(true), // Por padrão, a senha está correta nos testes
}))

vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn().mockReturnValue('mocked-jwt-token'),
  },
}))

// Importando os mocks para poder manipular o comportamento deles se necessário nos blocos it
import { compare } from 'bcrypt'
import jwt from 'jsonwebtoken'

describe('LogarUseCase Unit Tests', () => {
  let usuarioRepositoryMock: UsuarioRepository
  let autenticacaoRepositoryMock: AutenticacaoRepository
  let useCase: LogarUseCase

  let usuarioMock: any
  let autenticacaoMock: any
  const originalEnv = process.env.JWT_SECRET

  const inputValido: LogarInputDto = {
    email: 'dev@example.com',
    senha: 'SenhaSegura123',
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Configurando a variável de ambiente padrão para os testes
    process.env.JWT_SECRET = 'super-secret-key'

    usuarioMock = { id: 'user-id-123', email: 'dev@example.com' }
    autenticacaoMock = { usuarioId: 'user-id-123', senha: 'hashed-password' }

    // Criando os mocks dos repositórios
    usuarioRepositoryMock = {
      findByEmail: vi.fn().mockResolvedValue(usuarioMock),
    } as unknown as UsuarioRepository

    autenticacaoRepositoryMock = {
      findByUsuarioId: vi.fn().mockResolvedValue(autenticacaoMock),
    } as unknown as AutenticacaoRepository

    useCase = LogarUseCase.create(usuarioRepositoryMock, autenticacaoRepositoryMock)
  })

  afterEach(() => {
    // Restaura o ambiente original após cada teste
    process.env.JWT_SECRET = originalEnv
  })

  it('deve realizar o login com sucesso e retornar o id do usuário e o token JWT', async () => {
    // Act
    const resultado = await useCase.execute(inputValido)

    // Assert
    // 1. Verificações nos repositórios
    expect(usuarioRepositoryMock.findByEmail).toHaveBeenCalledWith('dev@example.com')
    expect(autenticacaoRepositoryMock.findByUsuarioId).toHaveBeenCalledWith('user-id-123')

    // 2. Verificação da criptografia (bcrypt)
    expect(compare).toHaveBeenCalledWith('SenhaSegura123', 'hashed-password')

    // 3. Verificação da assinatura do JWT
    expect(jwt.sign).toHaveBeenCalledWith({ sub: 'user-id-123' }, 'super-secret-key', {
      expiresIn: '1h',
    })

    // 4. Verificação do retorno do DTO
    expect(resultado).toStrictEqual({
      id: 'user-id-123',
      token: 'mocked-jwt-token',
    })
  })

  it('deve lançar erro se o e-mail não for encontrado no banco de dados', async () => {
    // Arrange: Usuário não existe
    vi.spyOn(usuarioRepositoryMock, 'findByEmail').mockResolvedValueOnce(null as any)

    // Act & Assert
    await expect(useCase.execute(inputValido)).rejects.toThrow('Credenciais invalidas')

    // Garante que o fluxo travou e não buscou credenciais nem criptografia
    expect(autenticacaoRepositoryMock.findByUsuarioId).not.toHaveBeenCalled()
    expect(compare).not.toHaveBeenCalled()
  })

  it('deve lançar erro se o usuário existir mas não possuir registro de autenticação', async () => {
    // Arrange: Usuário existe, mas findByUsuarioId retorna null
    vi.spyOn(autenticacaoRepositoryMock, 'findByUsuarioId').mockResolvedValueOnce(null as any)

    // Act & Assert
    await expect(useCase.execute(inputValido)).rejects.toThrow(
      'O usuario não possui credenciais para autenticação',
    )

    expect(compare).not.toHaveBeenCalled()
    expect(jwt.sign).not.toHaveBeenCalled()
  })

  it('deve lançar erro se a senha estiver incorreta', async () => {
    // Arrange: Força o bcrypt.compare a retornar false (senha inválida)
    vi.mocked(compare).mockResolvedValueOnce(false as never)

    // Act & Assert
    await expect(useCase.execute(inputValido)).rejects.toThrow('Credenciais invalidas')

    // Se a senha errou, o token jamais pode ser assinado
    expect(jwt.sign).not.toHaveBeenCalled()
  })

  it('deve lançar erro se a variável de ambiente JWT_SECRET não estiver definida', async () => {
    // Arrange: Remove a chave secreta das variáveis de ambiente
    delete process.env.JWT_SECRET

    // Act & Assert
    await expect(useCase.execute(inputValido)).rejects.toThrow('JWT_SECRET não definido')

    // A senha estava certa, mas o fluxo travou antes de gerar o token por falta de configuração
    expect(jwt.sign).not.toHaveBeenCalled()
  })
})
