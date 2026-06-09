import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AmbienteRepository } from '../../../domain/ambiente/ambiente.repository.js'
import type { AtualizarAmbienteInputDto } from '../dtos/atualizar-ambiente.dto.js'
import { AtualizarAmbienteUseCase } from './atualizar-ambiente.usecase.js' // Ajuste o caminho se necessário

// 1. Mockando o Mapper para isolar completamente o Use Case
vi.mock('../mappers/atualizar-ambiente.mapper.js', () => ({
  AtualizarAmbienteMapper: {
    paraOutput: vi.fn().mockReturnValue({ id: 'ambiente-id-123' }),
  },
}))

import { AtualizarAmbienteMapper } from '../mappers/atualizar-ambiente.mapper.js'

describe('AtualizarAmbienteUseCase Unit Tests', () => {
  let ambienteRepositoryMock: AmbienteRepository
  let useCase: AtualizarAmbienteUseCase
  let ambienteEntityMock: any

  // Input válido padrão (com dados a serem alterados)
  const inputValido: AtualizarAmbienteInputDto = {
    id: 'ambiente-id-123',
    nome: 'Novo Nome Geladeira',
    temperatura_maxima: 12,
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock do comportamento interno da entidade Ambiente
    ambienteEntityMock = {
      id: 'ambiente-id-123',
      update: vi.fn(), // Espiando o método update da entidade
    }

    // Criando o mock do repositório com as funções necessárias
    ambienteRepositoryMock = {
      findById: vi.fn().mockResolvedValue(ambienteEntityMock),
      update: vi.fn().mockResolvedValue(undefined),
    } as unknown as AmbienteRepository

    useCase = AtualizarAmbienteUseCase.create(ambienteRepositoryMock)
  })

  it('deve atualizar um ambiente com sucesso, persistir e chamar o mapper', async () => {
    // Act
    const resultado = await useCase.execute(inputValido)

    // Assert
    // 1. Verifica se buscou o ambiente correto no banco
    expect(ambienteRepositoryMock.findById).toHaveBeenCalledWith('ambiente-id-123')

    // 2. Garante que as alterações foram repassadas para o método update da entidade
    expect(ambienteEntityMock.update).toHaveBeenCalledWith(
      inputValido.nome,
      inputValido.descricao, // undefined
      inputValido.temperatura_minima, // undefined
      inputValido.temperatura_maxima,
      inputValido.umidade_minima, // undefined
      inputValido.umidade_maxima,
    )

    // 3. Verifica se salvou a entidade alterada no repositório
    expect(ambienteRepositoryMock.update).toHaveBeenCalledWith(ambienteEntityMock)

    // 4. Garante a delegação para o mapper e o retorno esperado
    expect(AtualizarAmbienteMapper.paraOutput).toHaveBeenCalledWith(ambienteEntityMock)
    expect(resultado).toStrictEqual({ id: 'ambiente-id-123' })
  })

  it('deve lançar erro se o DTO não contiver nenhum dado para alteração', async () => {
    // Arrange: Input apenas com o ID, sem nenhuma propriedade preenchida
    const inputSemDados: AtualizarAmbienteInputDto = {
      id: 'ambiente-id-123',
    }

    // Act & Assert
    await expect(useCase.execute(inputSemDados)).rejects.toThrow(
      'Não é possivel atualizar ambiente: não existe nenhum dado a ser alterado',
    )

    // Garante que o fluxo travou na primeira validação e não tocou no banco
    expect(ambienteRepositoryMock.findById).not.toHaveBeenCalled()
  })

  it('deve lançar erro se o ambiente não for encontrado no repositório', async () => {
    // Arrange: Configura o findById para retornar null (ambiente inexistente)
    vi.spyOn(ambienteRepositoryMock, 'findById').mockResolvedValueOnce(null as any)

    // Act & Assert
    await expect(useCase.execute(inputValido)).rejects.toThrow(
      'Não é possível atualizar ambiente: não existe ambiente associado a esse id.',
    )

    // Garante que o fluxo parou ali e não tentou atualizar ou mapear nada
    expect(ambienteEntityMock.update).not.toHaveBeenCalled()
    expect(ambienteRepositoryMock.update).not.toHaveBeenCalled()
    expect(AtualizarAmbienteMapper.paraOutput).not.toHaveBeenCalled()
  })

  it('deve repassar a exceção caso o repositório falhe ao salvar no banco', async () => {
    // Arrange: Simula uma falha na hora de persistir a atualização
    vi.spyOn(ambienteRepositoryMock, 'update').mockRejectedValueOnce(
      new Error('Erro de concorrência no banco'),
    )

    // Act & Assert
    await expect(useCase.execute(inputValido)).rejects.toThrow('Erro de concorrência no banco')

    // Se a gravação falhou, o mapper não deve ser chamado
    expect(AtualizarAmbienteMapper.paraOutput).not.toHaveBeenCalled()
  })
})
