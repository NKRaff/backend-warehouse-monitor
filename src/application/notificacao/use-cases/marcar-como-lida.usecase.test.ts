import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { NotificacaoRepository } from '../../../domain/notificacao/notificacao.repository.js'
import type { MarcarComoLidaInputDto } from '../dtos/marcar-como-lida.dto.js'
import { MarcarComoLidaUseCase } from './marcar-como-lida.usecase.js'

describe('MarcarComoLidaUseCase Unit Tests', () => {
  let notificacaoRepositoryMock: NotificacaoRepository
  let useCase: MarcarComoLidaUseCase
  let notificacaoEntityMock: any

  const inputValido: MarcarComoLidaInputDto = {
    notificacaoId: 'notificacao-id-123',
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // 1. Criamos o mock da entidade garantindo o método de domínio 'marcarComoLida'
    notificacaoEntityMock = {
      id: 'notificacao-id-123',
      alertaId: 'alerta-999',
      usuarioId: 'usuario-01',
      lida: false,
      marcarComoLida: vi.fn(), // Spy para verificar se a regra de negócio foi disparada
    }

    // 2. Configurando o mock do repositório
    notificacaoRepositoryMock = {
      findById: vi.fn().mockResolvedValue(notificacaoEntityMock),
      updateLida: vi.fn().mockResolvedValue(undefined),
    } as unknown as NotificacaoRepository

    useCase = MarcarComoLidaUseCase.create(notificacaoRepositoryMock)
  })

  it('deve marcar uma notificação como lida com sucesso (Caminho Feliz)', async () => {
    // Act
    await useCase.execute(inputValido)

    // Assert
    // 1. Garante que buscou a notificação correta no banco
    expect(notificacaoRepositoryMock.findById).toHaveBeenCalledTimes(1)
    expect(notificacaoRepositoryMock.findById).toHaveBeenCalledWith('notificacao-id-123')

    // 2. Garante que o método interno da entidade de alteração de estado foi chamado
    expect(notificacaoEntityMock.marcarComoLida).toHaveBeenCalledTimes(1)

    // 3. Garante que persistiu a alteração usando o repositório correto
    expect(notificacaoRepositoryMock.updateLida).toHaveBeenCalledTimes(1)
    expect(notificacaoRepositoryMock.updateLida).toHaveBeenCalledWith(
      'notificacao-id-123',
      notificacaoEntityMock,
    )
  })

  it('deve lançar um erro se a notificação não for encontrada', async () => {
    // Arrange: Força o repositório a retornar null (não encontrada)
    vi.spyOn(notificacaoRepositoryMock, 'findById').mockResolvedValueOnce(null as any)

    // Act & Assert
    await expect(useCase.execute(inputValido)).rejects.toThrow('Notificação não foi encontrada')

    // Garantias de fluxo: se não achou, não pode alterar a entidade e nem atualizar o banco
    expect(notificacaoRepositoryMock.findById).toHaveBeenCalledWith('notificacao-id-123')
    expect(notificacaoEntityMock.marcarComoLida).not.toHaveBeenCalled()
    expect(notificacaoRepositoryMock.updateLida).not.toHaveBeenCalled()
  })

  it('deve repassar a exceção caso o repositório falhe ao buscar a notificação', async () => {
    // Arrange: Simula uma falha de conexão ou erro de sintaxe no findById
    const erroBanco = new Error('Erro interno de conexão com o banco')
    vi.spyOn(notificacaoRepositoryMock, 'findById').mockRejectedValueOnce(erroBanco)

    // Act & Assert
    await expect(useCase.execute(inputValido)).rejects.toThrow(
      'Erro interno de conexão com o banco',
    )

    expect(notificacaoEntityMock.marcarComoLida).not.toHaveBeenCalled()
    expect(notificacaoRepositoryMock.updateLida).not.toHaveBeenCalled()
  })

  it('deve repassar a exceção caso o repositório falhe ao atualizar o status da notificação', async () => {
    // Arrange: A busca funciona, mas o update falha
    const erroSalvar = new Error('Falha ao persistir dados do update')
    vi.spyOn(notificacaoRepositoryMock, 'updateLida').mockRejectedValueOnce(erroSalvar)

    // Act & Assert
    await expect(useCase.execute(inputValido)).rejects.toThrow('Falha ao persistir dados do update')

    // Verifica que os passos anteriores aconteceram antes do erro estourar
    expect(notificacaoRepositoryMock.findById).toHaveBeenCalledWith('notificacao-id-123')
    expect(notificacaoEntityMock.marcarComoLida).toHaveBeenCalledTimes(1)
    expect(notificacaoRepositoryMock.updateLida).toHaveBeenCalledWith(
      'notificacao-id-123',
      notificacaoEntityMock,
    )
  })
})
