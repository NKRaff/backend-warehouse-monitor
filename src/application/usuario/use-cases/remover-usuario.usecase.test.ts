import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AutenticacaoRepository } from '../../../domain/autenticacao/autenticacao.repository.js'
import type { UsuarioRepository } from '../../../domain/usuario/usuario.repository.js'
import type { RemoverUsuarioInputDto } from '../dtos/remover-usuario.dto.js'
import { RemoverUsuarioUseCase } from './remover-usuario.usecase.js' // Ajuste o caminho se necessário

describe('RemoverUsuarioUseCase Unit Tests', () => {
  let usuarioRepositoryMock: UsuarioRepository
  let autenticacaoRepositoryMock: AutenticacaoRepository
  let useCase: RemoverUsuarioUseCase

  let usuarioFake: any
  let autenticacaoFake: any

  const inputValido: RemoverUsuarioInputDto = {
    id: 'user-id-rafael-123',
  }

  beforeEach(() => {
    vi.clearAllMocks()

    usuarioFake = { id: 'user-id-rafael-123', nome: 'Rafael Rocha' }
    autenticacaoFake = { id: 'auth-id-abc', usuarioId: 'user-id-rafael-123' }

    // Inicializando os mocks dos repositórios
    usuarioRepositoryMock = {
      findById: vi.fn().mockResolvedValue(usuarioFake),
      delete: vi.fn().mockResolvedValue(undefined),
    } as unknown as UsuarioRepository

    autenticacaoRepositoryMock = {
      findByUsuarioId: vi.fn().mockResolvedValue(autenticacaoFake),
      delete: vi.fn().mockResolvedValue(undefined),
    } as unknown as AutenticacaoRepository

    useCase = RemoverUsuarioUseCase.create(usuarioRepositoryMock, autenticacaoRepositoryMock)
  })

  it('deve remover o usuário e suas credenciais com sucesso quando ambos existirem', async () => {
    // Act & Assert
    await expect(useCase.execute(inputValido)).resolves.not.toThrow()

    // 1. Validações de busca
    expect(usuarioRepositoryMock.findById).toHaveBeenCalledWith('user-id-rafael-123')
    expect(autenticacaoRepositoryMock.findByUsuarioId).toHaveBeenCalledWith('user-id-rafael-123')

    // 2. Validações de deleção física/lógica no banco
    expect(usuarioRepositoryMock.delete).toHaveBeenCalledTimes(1)
    expect(usuarioRepositoryMock.delete).toHaveBeenCalledWith('user-id-rafael-123')

    expect(autenticacaoRepositoryMock.delete).toHaveBeenCalledTimes(1)
    expect(autenticacaoRepositoryMock.delete).toHaveBeenCalledWith('auth-id-abc')
  })

  it('deve lançar erro e interromper o fluxo se o usuário não for encontrado', async () => {
    // Arrange: Simula que o usuário não existe no banco
    vi.spyOn(usuarioRepositoryMock, 'findById').mockResolvedValueOnce(null as any)

    // Act & Assert
    await expect(useCase.execute(inputValido)).rejects.toThrow(
      'Não é possivel remover usuario: esse usuario não existe',
    )

    // Garantia de isolamento: nada de autenticação ou deleção deve ser tocado
    expect(autenticacaoRepositoryMock.findByUsuarioId).not.toHaveBeenCalled()
    expect(usuarioRepositoryMock.delete).not.toHaveBeenCalled()
    expect(autenticacaoRepositoryMock.delete).not.toHaveBeenCalled()
  })

  it('deve lançar erro e não deletar nada se o usuário existir mas não possuir credenciais', async () => {
    // Arrange: Usuário existe, mas credenciais retornam nulas
    vi.spyOn(autenticacaoRepositoryMock, 'findByUsuarioId').mockResolvedValueOnce(null as any)

    // Act & Assert
    await expect(useCase.execute(inputValido)).rejects.toThrow(
      'Não é possivel remover usuario: o usuario não possui credenciais',
    )

    // A segunda barreira barrou: as operações de exclusão não foram chamadas
    expect(usuarioRepositoryMock.findById).toHaveBeenCalledWith('user-id-rafael-123')
    expect(usuarioRepositoryMock.delete).not.toHaveBeenCalled()
    expect(autenticacaoRepositoryMock.delete).not.toHaveBeenCalled()
  })

  it('deve propagar o erro caso a deleção do usuário quebre no banco de dados', async () => {
    // Arrange: Passa nas buscas, mas falha na hora de rodar o comando delete do usuário
    vi.spyOn(usuarioRepositoryMock, 'delete').mockRejectedValueOnce(
      new Error('Erro de chave estrangeira ou banco'),
    )

    // Act & Assert
    await expect(useCase.execute(inputValido)).rejects.toThrow('Erro de chave estrangeira ou banco')

    // Verificação de fluxo: tentou deletar o usuário, mas quebrou antes de remover o registro de autenticação
    expect(usuarioRepositoryMock.delete).toHaveBeenCalledWith('user-id-rafael-123')
    expect(autenticacaoRepositoryMock.delete).not.toHaveBeenCalled()
  })
})
