import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CriarAmbienteInputDto } from '../dtos/criar-ambiente.dto.js'
import { CriarAmbienteUseCase } from './criar-ambiente.usecase.js'

// 1. Mockando o Mapper para isolar completamente o Use Case
// Importamos o caminho exato do mapper que o Use Case consome
vi.mock('../mappers/criar-ambiente.mapper.js', () => ({
  CriarAmbienteMapper: {
    paraOutput: vi.fn().mockReturnValue({ id: 'mocked-uuid-v7' }),
  },
}))

import { Ambiente } from '../../../domain/ambiente/ambiente.entity.js'
import type { AmbienteRepository } from '../../../domain/ambiente/ambiente.repository.js'
// Importamos o Mapper aqui apenas para poder fazer asserções (Spy) nele nos testes
import { CriarAmbienteMapper } from '../mappers/criar-ambiente.mapper.js'

// Mockando a geração do UUID v7
vi.mock('uuid', () => ({
  v7: () => 'mocked-uuid-v7',
}))

describe('CriarAmbienteUseCase Unit Tests (Com Isolamento Total)', () => {
  let ambienteRepositoryMock: AmbienteRepository
  let useCase: CriarAmbienteUseCase

  const inputValido: CriarAmbienteInputDto = {
    nome: 'geladeira',
    tipo: 'frio',
    temperatura_minima: 5,
    temperatura_maxima: 15,
    umidade_minima: 50,
    umidade_maxima: 80,
    descricao: 'Ambiente de testes',
  }

  beforeEach(() => {
    // Limpa o histórico de chamadas dos mocks antes de cada teste
    vi.clearAllMocks()

    ambienteRepositoryMock = {
      save: vi.fn().mockResolvedValue(undefined),
    } as unknown as AmbienteRepository

    useCase = CriarAmbienteUseCase.create(ambienteRepositoryMock)
  })

  it('deve criar um ambiente, salvar no repo, chamar o mapper e retornar seu resultado', async () => {
    // Act
    const resultado = await useCase.execute(inputValido)

    // Assert
    // Garante que salvou no banco
    expect(ambienteRepositoryMock.save).toHaveBeenCalledTimes(1)
    expect(ambienteRepositoryMock.save).toHaveBeenCalledWith(expect.any(Ambiente))

    // Garante que o Use Case delegou a transformação para o Mapper
    expect(CriarAmbienteMapper.paraOutput).toHaveBeenCalledTimes(1)
    expect(CriarAmbienteMapper.paraOutput).toHaveBeenCalledWith(expect.any(Ambiente))

    // O retorno deve ser exatamente o formato que o seu Mapper entrega (definido lá no vi.mock)
    expect(resultado).toStrictEqual({ id: 'mocked-uuid-v7' })
  })

  it('deve falhar e não chamar o mapper se o repositório lançar um erro', async () => {
    // Arrange
    vi.spyOn(ambienteRepositoryMock, 'save').mockRejectedValueOnce(new Error('Erro de banco'))

    // Act & Assert
    await expect(useCase.execute(inputValido)).rejects.toThrow('Erro de banco')

    // Se o banco falhou, o mapper nunca deveria ter sido executado
    expect(CriarAmbienteMapper.paraOutput).not.toHaveBeenCalled()
  })
})
