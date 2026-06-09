import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { UsuarioRepository } from '../../../domain/usuario/usuario.repository.js'
import type { RecebimentoEmailInputDto } from '../dtos/recebimento-email.dto.js'
import { AtivarRecebimentoEmailUseCase } from './ativar-recebimento-email.usecase.js' // Ajuste o caminho se necessário

describe('AtivarRecebimentoEmailUseCase Unit Tests', () => {
  let usuarioRepositoryMock: UsuarioRepository
  let useCase: AtivarRecebimentoEmailUseCase
  let usuarioEntityMock: any

  const inputValido: RecebimentoEmailInputDto = {
    id: 'usuario-rafael-123',
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock da entidade de domínio rica com o método mutador
    usuarioEntityMock = {
      id: 'usuario-rafael-123',
      nome: 'Rafael Rocha',
      receberEmail: false,
      ativarRecebimentoDeEmail: vi.fn().mockImplementation(function (this: any) {
        this.receberEmail = true
      }),
    }

    // Configurando o mock do repositório
    usuarioRepositoryMock = {
      findById: vi.fn().mockResolvedValue(usuarioEntityMock),
      updateRecebimentoEmail: vi.fn().mockResolvedValue(undefined),
    } as unknown as UsuarioRepository

    useCase = AtivarRecebimentoEmailUseCase.create(usuarioRepositoryMock)
  })

  it('deve ativar o recebimento de e-mail do usuário com sucesso', async () => {
    // Act & Assert
    await expect(useCase.execute(inputValido)).resolves.not.toThrow()

    // 1. Garante que buscou o usuário correto no banco
    expect(usuarioRepositoryMock.findById).toHaveBeenCalledTimes(1)
    expect(usuarioRepositoryMock.findById).toHaveBeenCalledWith('usuario-rafael-123')

    // 2. Garante que a regra de negócio interna da entidade foi disparada
    expect(usuarioEntityMock.ativarRecebimentoDeEmail).toHaveBeenCalledTimes(1)

    // 3. Garante que o repositório foi chamado para persistir o estado atualizado da entidade
    expect(usuarioRepositoryMock.updateRecebimentoEmail).toHaveBeenCalledTimes(1)
    expect(usuarioRepositoryMock.updateRecebimentoEmail).toHaveBeenCalledWith(
      'usuario-rafael-123',
      usuarioEntityMock,
    )
  })

  it('deve lançar erro e interromper o fluxo se o usuário não for encontrado', async () => {
    // Arrange: Simula que o usuário não existe retornando null
    vi.spyOn(usuarioRepositoryMock, 'findById').mockResolvedValueOnce(null as any)

    // Act & Assert
    await expect(useCase.execute(inputValido)).rejects.toThrow('Usuario não encontrado')

    // A barreira funcionou: nenhuma mutação ou persistência deve ser chamada
    expect(usuarioRepositoryMock.updateRecebimentoEmail).not.toHaveBeenCalled()
  })

  it('deve propagar a exceção caso a persistência da atualização falhe no banco', async () => {
    // Arrange: Passa pela busca, mas falha na hora de atualizar os dados
    vi.spyOn(usuarioRepositoryMock, 'updateRecebimentoEmail').mockRejectedValueOnce(
      new Error('Erro de conexão ao persistir dados'),
    )

    // Act & Assert
    await expect(useCase.execute(inputValido)).rejects.toThrow('Erro de conexão ao persistir dados')

    // Certifica que a busca e a alteração na entidade ocorreram antes do erro de persistência
    expect(usuarioRepositoryMock.findById).toHaveBeenCalledWith('usuario-rafael-123')
    expect(usuarioEntityMock.ativarRecebimentoDeEmail).toHaveBeenCalled()
  })
})
