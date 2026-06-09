import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AmbienteRepository } from '../../../domain/ambiente/ambiente.repository.js'
import { ListarAmbientesUseCase } from './listar-ambientes.usecase.js' // Ajuste o caminho se necessário

// 1. Mockando o Mapper para isolar completamente o Use Case
vi.mock('../mappers/listar-ambientes.mapper.js', () => ({
  ListarAmbientesMapper: {
    paraOutput: vi.fn().mockReturnValue({
      ambientes: [
        {
          id: 'ambiente-id-1',
          nome: 'geladeira',
          tipo: 'frio',
          descricao: 'Ambiente de testes',
          temperatura_minima: 5,
          temperatura_maxima: 15,
          umidade_minima: 50,
          umidade_maxima: 80,
        },
      ],
    }),
  },
}))

import { ListarAmbientesMapper } from '../mappers/listar-ambientes.mapper.js'

describe('ListarAmbientesUseCase Unit Tests', () => {
  let ambienteRepositoryMock: AmbienteRepository
  let useCase: ListarAmbientesUseCase
  let listaAmbientesMock: any[]

  beforeEach(() => {
    vi.clearAllMocks()

    // Criando uma lista fake de entidades que o repositório supostamente retornaria
    listaAmbientesMock = [
      {
        id: 'ambiente-id-1',
        nome: 'geladeira',
        tipo: 'frio',
        descricao: 'Ambiente de testes',
        temperaturaMinima: 5,
        temperaturaMaxima: 15,
        umidadeMinima: 50,
        umidadeMaxima: 80,
      },
    ]

    // Criando o mock do repositório com o método findAll
    ambienteRepositoryMock = {
      findAll: vi.fn().mockResolvedValue(listaAmbientesMock),
    } as unknown as AmbienteRepository

    useCase = ListarAmbientesUseCase.create(ambienteRepositoryMock)
  })

  it('deve listar os ambientes com sucesso, chamar o mapper e retornar a lista formatada', async () => {
    // Act
    const resultado = await useCase.execute()

    // Assert
    // 1. Garante que o repositório buscou todos os registros
    expect(ambienteRepositoryMock.findAll).toHaveBeenCalledTimes(1)

    // 2. Garante que a lista retornada do banco foi repassada exatamente como estava para o Mapper
    expect(ListarAmbientesMapper.paraOutput).toHaveBeenCalledTimes(1)
    expect(ListarAmbientesMapper.paraOutput).toHaveBeenCalledWith(listaAmbientesMock)

    // 3. Garante que o retorno é exatamente a estrutura mockada no topo do arquivo para o Mapper
    expect(resultado).toStrictEqual({
      ambientes: [
        {
          id: 'ambiente-id-1',
          nome: 'geladeira',
          tipo: 'frio',
          descricao: 'Ambiente de testes',
          temperatura_minima: 5,
          temperatura_maxima: 15,
          umidade_minima: 50,
          umidade_maxima: 80,
        },
      ],
    })
  })

  it('deve retornar uma lista vazia se o repositório não encontrar nenhum ambiente', async () => {
    // Arrange: Configura o repositório para retornar um array vazio
    vi.spyOn(ambienteRepositoryMock, 'findAll').mockResolvedValueOnce([])

    // Altera temporariamente o retorno do mock do Mapper para este cenário
    vi.spyOn(ListarAmbientesMapper, 'paraOutput').mockReturnValueOnce({ ambientes: [] })

    // Act
    const resultado = await useCase.execute()

    // Assert
    expect(ambienteRepositoryMock.findAll).toHaveBeenCalledTimes(1)
    expect(ListarAmbientesMapper.paraOutput).toHaveBeenCalledWith([])
    expect(resultado).toStrictEqual({ ambientes: [] })
  })

  it('deve repassar a exceção caso o repositório lance um erro', async () => {
    // Arrange: Força o banco a quebrar
    vi.spyOn(ambienteRepositoryMock, 'findAll').mockRejectedValueOnce(
      new Error('Erro interno do banco de dados'),
    )

    // Act & Assert
    await expect(useCase.execute()).rejects.toThrow('Erro interno do banco de dados')

    // Se o banco falhar, o mapper não pode ser chamado de forma alguma
    expect(ListarAmbientesMapper.paraOutput).not.toHaveBeenCalled()
  })
})
