import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { MedicaoRepository } from '../../../domain/medicao/medicao.repository.js'
import type { BuscarUltimaMedicaoInputDto } from '../dtos/buscar-ultima-medicao.dto.js'
import { BuscarUltimaMedicaoUseCase } from './buscar-ultima-medicao.usecase.js' // Ajuste o caminho se necessário

// 1. Mockando o Mapper para isolar completamente o Use Case
vi.mock('../mappers/buscar-ultima-medicao.mapper.js', () => ({
  BuscarUltimaMedicaoMapper: {
    paraOutput: vi.fn().mockReturnValue({
      id: 'ultima-medicao-id',
      dispositivoId: 'esp32-01',
      ambienteId: 'ambiente-frio-999',
      tipo: 'umidade',
      valor: 65.2,
      createdAt: new Date('2026-05-20T15:00:00Z'),
      updatedAt: new Date('2026-05-20T15:00:00Z'),
    }),
  },
}))

import { BuscarUltimaMedicaoMapper } from '../mappers/buscar-ultima-medicao.mapper.js'

describe('BuscarUltimaMedicaoUseCase Unit Tests', () => {
  let medicaoRepositoryMock: MedicaoRepository
  let useCase: BuscarUltimaMedicaoUseCase
  let medicaoEntityMock: any

  const inputValido: BuscarUltimaMedicaoInputDto = {
    dispositivoId: 'esp32-01',
  } as any // Cast caso seu DTO possua tipagem estrita

  beforeEach(() => {
    vi.clearAllMocks()

    // Entidade simulada representando a última leitura do banco
    medicaoEntityMock = {
      id: 'ultima-medicao-id',
      dispositivoId: 'esp32-01',
      ambienteId: 'ambiente-frio-999',
      tipo: 'umidade',
      valor: 65.2,
      createdAt: new Date('2026-05-20T15:00:00Z'),
      updatedAt: new Date('2026-05-20T15:00:00Z'),
    }

    // Configurando o mock do repositório
    medicaoRepositoryMock = {
      findLast: vi.fn().mockResolvedValue(medicaoEntityMock),
    } as unknown as MedicaoRepository

    useCase = BuscarUltimaMedicaoUseCase.create(medicaoRepositoryMock)
  })

  it('deve buscar a última medição com sucesso, chamar o mapper e retornar o objeto formatado', async () => {
    // Act
    const resultado = await useCase.execute(inputValido)

    // Assert
    // 1. Garante que consultou o repositório passando os parâmetros corretos (ex: id do dispositivo)
    expect(medicaoRepositoryMock.findLast).toHaveBeenCalledTimes(1)
    expect(medicaoRepositoryMock.findLast).toHaveBeenCalledWith(inputValido)

    // 2. Garante que repassou a entidade encontrada para o Mapper transformar
    expect(BuscarUltimaMedicaoMapper.paraOutput).toHaveBeenCalledTimes(1)
    expect(BuscarUltimaMedicaoMapper.paraOutput).toHaveBeenCalledWith(medicaoEntityMock)

    // 3. Verifica o formato de saída mapeado
    expect(resultado).toStrictEqual({
      id: 'ultima-medicao-id',
      dispositivoId: 'esp32-01',
      ambienteId: 'ambiente-frio-999',
      tipo: 'umidade',
      valor: 65.2,
      createdAt: new Date('2026-05-20T15:00:00Z'),
      updatedAt: new Date('2026-05-20T15:00:00Z'),
    })
  })

  it('deve lançar exceção originada do Mapper se o repositório retornar null (nenhuma medição encontrada)', async () => {
    // Arrange: Simula que o dispositivo ainda não gerou nenhuma telemetria no banco
    vi.spyOn(medicaoRepositoryMock, 'findLast').mockResolvedValueOnce(null as any)

    // Configura o comportamento real ou mockado do seu Mapper para lançar o erro ao receber null
    vi.spyOn(BuscarUltimaMedicaoMapper, 'paraOutput').mockImplementationOnce(() => {
      throw new Error('Medição invalida')
    })

    // Act & Assert
    // O Use Case deve repassar o erro gerado pelo Mapper de forma limpa
    await expect(useCase.execute(inputValido)).rejects.toThrow('Medição invalida')

    expect(medicaoRepositoryMock.findLast).toHaveBeenCalledWith(inputValido)
    expect(BuscarUltimaMedicaoMapper.paraOutput).toHaveBeenCalledWith(null)
  })

  it('deve repassar a exceção caso o repositório falhe na conexão ou execução', async () => {
    // Arrange: Força o banco de dados a quebrar
    vi.spyOn(medicaoRepositoryMock, 'findLast').mockRejectedValueOnce(
      new Error('Erro de leitura no banco'),
    )

    // Act & Assert
    await expect(useCase.execute(inputValido)).rejects.toThrow('Erro de leitura no banco')

    // Se o banco falhar, o fluxo morre imediatamente e o Mapper não é executado
    expect(BuscarUltimaMedicaoMapper.paraOutput).not.toHaveBeenCalled()
  })
})
