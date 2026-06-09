import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AmbienteRepository } from '../../../domain/ambiente/ambiente.repository.js'
import type { DispositivoRepository } from '../../../domain/dispositivo/despositivo.repository.js'
import type { RemoverAmbienteInputDto } from '../dtos/remover-ambiente.dto.js'
import { RemoverAmbienteUseCase } from './remover-ambiente.usecase.js' // Ajuste o caminho se necessário

describe('RemoverAmbienteUseCase Unit Tests', () => {
  let ambienteRepositoryMock: AmbienteRepository
  let dispositivoRepositoryMock: DispositivoRepository
  let useCase: RemoverAmbienteUseCase

  const inputValido: RemoverAmbienteInputDto = {
    id: 'ambiente-id-123',
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock do AmbienteRepository
    ambienteRepositoryMock = {
      delete: vi.fn().mockResolvedValue(undefined),
    } as unknown as AmbienteRepository

    // Mock do DispositivoRepository
    dispositivoRepositoryMock = {
      findByAmbienteId: vi.fn().mockResolvedValue([]),
    } as unknown as DispositivoRepository

    useCase = RemoverAmbienteUseCase.create(ambienteRepositoryMock, dispositivoRepositoryMock)
  })

  it('deve deletar o ambiente e desvincular todos os dispositivos associados com sucesso', async () => {
    // Arrange: Criando mocks para os dispositivos que possuem o método removerAmbiente
    const dispositivoMock1 = { id: 'disp-1', removerAmbiente: vi.fn() }
    const dispositivoMock2 = { id: 'disp-2', removerAmbiente: vi.fn() }

    vi.spyOn(dispositivoRepositoryMock, 'findByAmbienteId').mockResolvedValueOnce([
      dispositivoMock1,
      dispositivoMock2,
    ] as any)

    // Act
    await useCase.execute(inputValido)

    // Assert
    // 1. Garante que o ambiente foi deletado no repositório correto
    expect(ambienteRepositoryMock.delete).toHaveBeenCalledTimes(1)
    expect(ambienteRepositoryMock.delete).toHaveBeenCalledWith('ambiente-id-123')

    // 2. Garante que buscou os dispositivos daquele ambiente específico
    expect(dispositivoRepositoryMock.findByAmbienteId).toHaveBeenCalledWith('ambiente-id-123')

    // 3. Garante que a regra de negócio de desvincular o ambiente foi chamada em cada dispositivo
    expect(dispositivoMock1.removerAmbiente).toHaveBeenCalledTimes(1)
    expect(dispositivoMock2.removerAmbiente).toHaveBeenCalledTimes(1)
  })

  it('deve deletar o ambiente com sucesso mesmo se não houver nenhum dispositivo associado', async () => {
    // Arrange: Cenário onde findByAmbienteId retorna null ou array vazio
    vi.spyOn(dispositivoRepositoryMock, 'findByAmbienteId').mockResolvedValueOnce(null as any)

    // Act & Assert
    await expect(useCase.execute(inputValido)).resolves.not.toThrow()

    expect(ambienteRepositoryMock.delete).toHaveBeenCalledWith('ambiente-id-123')
    expect(dispositivoRepositoryMock.findByAmbienteId).toHaveBeenCalledWith('ambiente-id-123')
  })

  it('deve repassar a exceção caso o repositório de ambiente falhe ao deletar', async () => {
    // Arrange
    vi.spyOn(ambienteRepositoryMock, 'delete').mockRejectedValueOnce(
      new Error('Erro ao deletar ambiente'),
    )

    // Act & Assert
    await expect(useCase.execute(inputValido)).rejects.toThrow('Erro ao deletar ambiente')

    // Se falhou ao deletar o ambiente, o fluxo deve parar e não buscar os dispositivos
    expect(dispositivoRepositoryMock.findByAmbienteId).not.toHaveBeenCalled()
  })

  it('deve repassar a exceção caso a busca por dispositivos falhe', async () => {
    // Arrange
    vi.spyOn(dispositivoRepositoryMock, 'findByAmbienteId').mockRejectedValueOnce(
      new Error('Erro ao buscar dispositivos'),
    )

    // Act & Assert
    await expect(useCase.execute(inputValido)).rejects.toThrow('Erro ao buscar dispositivos')

    // O ambiente foi deletado, mas a falha subsequente foi propagada
    expect(ambienteRepositoryMock.delete).toHaveBeenCalledWith('ambiente-id-123')
  })
})
