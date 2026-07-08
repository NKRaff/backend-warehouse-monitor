import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { MedicaoRepository } from '../../../domain/medicao/medicao.repository.js'
import type { BuscarMedicoesInputDto } from '../dtos/buscar-medicoes.dto.js'
import { BuscarMedicaoUseCase } from './buscar-medicoes.usecase.js' // Ajuste o caminho se necessário

// 1. Mockando o Mapper para isolar completamente o Use Case
vi.mock('../mappers/buscar-medicoes.mapper.js', () => ({
  BuscarMedicoesMapper: {
    paraOutput: vi.fn().mockReturnValue({
      medicoes: [
        {
          id: 'medicao-id-111',
          dispositivoId: 'esp32-fungisense-01',
          ambienteId: 'ambiente-frio-999',
          tipo: 'temperatura',
          valor: 14.5,
          createdAt: new Date('2026-05-20T12:00:00Z'),
          updatedAt: new Date('2026-05-20T12:00:00Z'),
        },
      ],
    }),
  },
}))

import { BuscarMedicoesMapper } from '../mappers/buscar-medicoes.mapper.js'

describe('BuscarMedicaoUseCase Unit Tests', () => {
  let medicaoRepositoryMock: MedicaoRepository
  let useCase: BuscarMedicaoUseCase
  let listaMedicoesMock: any[]

  // Input simulando filtros de busca (ex: buscando por um dispositivo específico)
  const inputFiltros: BuscarMedicoesInputDto = {
    dispositivoId: 'esp32-fungisense-01',
  } as any // Cast se o seu DTO tiver propriedades estritas

  beforeEach(() => {
    vi.clearAllMocks()

    // Lista de entidades simuladas retornadas pelo método search do banco
    listaMedicoesMock = [
      {
        id: 'medicao-id-111',
        dispositivoId: 'esp32-fungisense-01',
        ambienteId: 'ambiente-frio-999',
        tipo: 'temperatura',
        valor: 14.5,
        createdAt: new Date('2026-05-20T12:00:00Z'),
        updatedAt: new Date('2026-05-20T12:00:00Z'),
      },
    ]

    // Criando o mock do repositório com o método search
    medicaoRepositoryMock = {
      search: vi.fn().mockResolvedValue(listaMedicoesMock),
    } as unknown as MedicaoRepository

    useCase = BuscarMedicaoUseCase.create(medicaoRepositoryMock)
  })

  it('deve buscar as medições aplicando os filtros, chamar o mapper e retornar os dados formatados', async () => {
    // Act
    const resultado = await useCase.execute(inputFiltros)

    // Assert
    // 1. Garante que o repositório foi acionado com os parâmetros/filtros de busca corretos
    expect(medicaoRepositoryMock.search).toHaveBeenCalledTimes(1)
    expect(medicaoRepositoryMock.search).toHaveBeenCalledWith(inputFiltros)

    // 2. Garante que os dados brutos retornados pelo banco foram repassados para o Mapper
    expect(BuscarMedicoesMapper.paraOutput).toHaveBeenCalledTimes(1)
    expect(BuscarMedicoesMapper.paraOutput).toHaveBeenCalledWith(listaMedicoesMock)

    // 3. Verifica se a estrutura final bate perfeitamente com o contrato definido no vi.mock
    expect(resultado).toStrictEqual({
      medicoes: [
        {
          id: 'medicao-id-111',
          dispositivoId: 'esp32-fungisense-01',
          ambienteId: 'ambiente-frio-999',
          tipo: 'temperatura',
          valor: 14.5,
          createdAt: new Date('2026-05-20T12:00:00Z'),
          updatedAt: new Date('2026-05-20T12:00:00Z'),
        },
      ],
    })
  })

  it('deve retornar uma lista vazia de medições caso a busca não traga resultados', async () => {
    // Arrange: Simula que nenhum registro bateu com os filtros (retorna array vazio)
    vi.spyOn(medicaoRepositoryMock, 'search').mockResolvedValueOnce([])

    // Altera temporariamente o retorno do mock do Mapper para este cenário
    vi.spyOn(BuscarMedicoesMapper, 'paraOutput').mockReturnValueOnce({ medicoes: [] })

    // Act
    const resultado = await useCase.execute(inputFiltros)

    // Assert
    expect(medicaoRepositoryMock.search).toHaveBeenCalledWith(inputFiltros)
    expect(BuscarMedicoesMapper.paraOutput).toHaveBeenCalledWith([])
    expect(resultado).toStrictEqual({ medicoes: [] })
  })

  it('deve repassar a exceção caso o repositório falhe na consulta complexa', async () => {
    // Arrange: Simula uma falha de banco (ex: timeout ou coluna inválida no filtro)
    vi.spyOn(medicaoRepositoryMock, 'search').mockRejectedValueOnce(
      new Error('Erro na consulta de busca'),
    )

    // Act & Assert
    await expect(useCase.execute(inputFiltros)).rejects.toThrow('Erro na consulta de busca')

    // Se o repositório quebrou, o Mapper não deve ser executado de forma alguma
    expect(BuscarMedicoesMapper.paraOutput).not.toHaveBeenCalled()
  })
})
