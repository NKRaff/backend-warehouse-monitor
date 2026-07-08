import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { DispositivoRepository } from '../../../domain/dispositivo/despositivo.repository.js'
import type { RemoverDispositivoInputDto } from '../dtos/remover-dispositivo.dto.js'
import { RemoverDispositivoUseCase } from './remover-dispositivo.usecase.js' // Ajuste o caminho se necessário

describe('RemoverDispositivoUseCase Unit Tests', () => {
  let dispositivoRepositoryMock: DispositivoRepository
  let useCase: RemoverDispositivoUseCase
  let dispositivoEntityMock: any

  const inputValido: RemoverDispositivoInputDto = {
    id: 'esp32-fungisense-01',
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock simples representando a entidade existente
    dispositivoEntityMock = {
      id: 'esp32-fungisense-01',
      nome: 'Sensor de Prateleira',
    }

    // Configurando o mock do repositório
    dispositivoRepositoryMock = {
      findById: vi.fn().mockResolvedValue(dispositivoEntityMock),
      delete: vi.fn().mockResolvedValue(undefined),
    } as unknown as DispositivoRepository

    useCase = RemoverDispositivoUseCase.create(dispositivoRepositoryMock)
  })

  it('deve remover o dispositivo com sucesso se ele existir no banco', async () => {
    // Act & Assert
    // Como retorna Promise<void>, garantimos que a promessa resolve sem estourar erros
    await expect(useCase.execute(inputValido)).resolves.not.toThrow()

    // 1. Garante que buscou antes para validar a existência
    expect(dispositivoRepositoryMock.findById).toHaveBeenCalledTimes(1)
    expect(dispositivoRepositoryMock.findById).toHaveBeenCalledWith('esp32-fungisense-01')

    // 2. Garante que chamou a deleção com o ID correto
    expect(dispositivoRepositoryMock.delete).toHaveBeenCalledTimes(1)
    expect(dispositivoRepositoryMock.delete).toHaveBeenCalledWith('esp32-fungisense-01')
  })

  it('deve lançar erro e não chamar o delete se o dispositivo não for encontrado', async () => {
    // Arrange: Simula que o dispositivo não existe retornando null
    vi.spyOn(dispositivoRepositoryMock, 'findById').mockResolvedValueOnce(null as any)

    // Act & Assert
    // String exata contendo o "nunhum" conforme a implementação da classe
    await expect(useCase.execute(inputValido)).rejects.toThrow(
      'Não é possivel remover dispositivo: não existe nunhum dispositivo com esse id',
    )

    // A barreira funcionou: o método delete jamais deve ter sido executado
    expect(dispositivoRepositoryMock.delete).not.toHaveBeenCalled()
  })

  it('deve repassar a exceção se o método delete do repositório falhar', async () => {
    // Arrange: Passa pela barreira do findById, mas falha fisicamente na hora de deletar do banco
    vi.spyOn(dispositivoRepositoryMock, 'delete').mockRejectedValueOnce(
      new Error('Erro de persistência'),
    )

    // Act & Assert
    await expect(useCase.execute(inputValido)).rejects.toThrow('Erro de persistência')

    // Confirma que a verificação de existência aconteceu normalmente antes da falha
    expect(dispositivoRepositoryMock.findById).toHaveBeenCalledWith('esp32-fungisense-01')
  })
})
