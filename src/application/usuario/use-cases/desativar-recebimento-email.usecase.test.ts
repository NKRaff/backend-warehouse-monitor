import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { UsuarioRepository } from '../../../domain/usuario/usuario.repository.js'
import type { RecebimentoEmailInputDto } from '../dtos/recebimento-email.dto.js'
import { DesativarRecebimentoEmailUseCase } from './desativar-recebimento-email.usecase.js' // Ajuste o caminho se necessário

describe('DesativarRecebimentoEmailUseCase Unit Tests', () => {
  let usuarioRepositoryMock: UsuarioRepository
  let useCase: DesativarRecebimentoEmailUseCase
  let usuarioEntityMock: any

  const inputValido: RecebimentoEmailInputDto = {
    id: 'usuario-rafael-789',
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock da entidade de domínio rica com o método mutador de desativação
    usuarioEntityMock = {
      id: 'usuario-rafael-789',
      nome: 'Rafael Rocha',
      receberEmail: true,
      desativarRecebimentoDeEmail: vi.fn().mockImplementation(function (this: any) {
        this.receberEmail = false
      }),
    }

    // Configurando o mock do repositório
    usuarioRepositoryMock = {
      findById: vi.fn().mockResolvedValue(usuarioEntityMock),
      updateRecebimentoEmail: vi.fn().mockResolvedValue(undefined),
    } as unknown as UsuarioRepository

    useCase = DesativarRecebimentoEmailUseCase.create(usuarioRepositoryMock)
  })

  it('deve desativar o recebimento de e-mail do usuário com sucesso', async () => {
    // Act & Assert
    // O método retorna Promise<void>, validamos que ele conclui sem lançar erros
    await expect(useCase.execute(inputValido)).resolves.not.toThrow()

    // 1. Verifica se buscou o usuário correto usando o ID fornecido
    expect(usuarioRepositoryMock.findById).toHaveBeenCalledTimes(1)
    expect(usuarioRepositoryMock.findById).toHaveBeenCalledWith('usuario-rafael-789')

    // 2. Garante que delegou a regra de negócio para a entidade de domínio
    expect(usuarioEntityMock.desativarRecebimentoDeEmail).toHaveBeenCalledTimes(1)

    // 3. Garante que chamou o método de persistência específico atualizando o estado no banco
    expect(usuarioRepositoryMock.updateRecebimentoEmail).toHaveBeenCalledTimes(1)
    expect(usuarioRepositoryMock.updateRecebimentoEmail).toHaveBeenCalledWith(
      'usuario-rafael-789',
      usuarioEntityMock,
    )
  })

  it('deve lançar erro e interromper o fluxo se o usuário não for encontrado', async () => {
    // Arrange: Simula que o usuário não existe retornando null
    vi.spyOn(usuarioRepositoryMock, 'findById').mockResolvedValueOnce(null as any)

    // Act & Assert
    await expect(useCase.execute(inputValido)).rejects.toThrow('Usuario não encontrado')

    // Cláusula de guarda funcionou: nada mais deve ser chamado
    expect(usuarioEntityMock.desativarRecebimentoDeEmail).not.toHaveBeenCalled()
    expect(usuarioRepositoryMock.updateRecebimentoEmail).not.toHaveBeenCalled()
  })

  it('deve propagar a exceção caso a persistência da atualização falhe no banco', async () => {
    // Arrange: Passa pela busca, mas falha catastroficamente na hora de salvar no banco
    vi.spyOn(usuarioRepositoryMock, 'updateRecebimentoEmail').mockRejectedValueOnce(
      new Error('Falha na conexão com a tabela de usuários'),
    )

    // Act & Assert
    await expect(useCase.execute(inputValido)).rejects.toThrow(
      'Falha na conexão com a tabela de usuários',
    )

    // Confirma que os passos anteriores de validação de domínio rodaram perfeitamente
    expect(usuarioRepositoryMock.findById).toHaveBeenCalledWith('usuario-rafael-789')
    expect(usuarioEntityMock.desativarRecebimentoDeEmail).toHaveBeenCalled()
  })
})
