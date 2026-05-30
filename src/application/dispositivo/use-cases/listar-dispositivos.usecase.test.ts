import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { DispositivoRepository } from '../../../domain/dispositivo/despositivo.repository.js'
import { ListarDispositivosUseCase } from './listar-dispositivos.usecase.js' // Ajuste o caminho se necessário

// 1. Mockando o Mapper para isolar completamente o Use Case
vi.mock('../mappers/listar-dispositivos.mappers.js', () => ({
  ListarDispositivosMapper: {
    paraOutput: vi.fn().mockReturnValue({
      dispositivos: [
        {
          id: 'esp32-01',
          nome: 'Sensor DHT22',
          ambienteId: 'ambiente-frio-123',
        },
      ],
    }),
  },
}))

import { ListarDispositivosMapper } from '../mappers/listar-dispositivos.mappers.js'

describe('ListarDispositivosUseCase Unit Tests', () => {
  let dispositivoRepositoryMock: DispositivoRepository
  let useCase: ListarDispositivosUseCase
  let listaDispositivosMock: any[]

  beforeEach(() => {
    vi.clearAllMocks()

    // Lista simulada de entidades retornadas pelo banco de dados
    listaDispositivosMock = [
      {
        id: 'esp32-01',
        nome: 'Sensor DHT22',
        ambienteId: 'ambiente-frio-123',
      },
    ]

    // Criando o mock do repositório
    dispositivoRepositoryMock = {
      findAll: vi.fn().mockResolvedValue(listaDispositivosMock),
    } as unknown as DispositivoRepository

    useCase = ListarDispositivosUseCase.create(dispositivoRepositoryMock)
  })

  it('deve retornar a lista de dispositivos formatada com sucesso', async () => {
    // Act
    const resultado = await useCase.execute()

    // Assert
    // 1. Garante que o repositório foi consultado corretamente
    expect(dispositivoRepositoryMock.findAll).toHaveBeenCalledTimes(1)

    // 2. Garante que os dados brutos vindos do banco foram repassados intactos para o Mapper
    expect(ListarDispositivosMapper.paraOutput).toHaveBeenCalledTimes(1)
    expect(ListarDispositivosMapper.paraOutput).toHaveBeenCalledWith(listaDispositivosMock)

    // 3. Garante que a estrutura final devolvida bate com o contrato mockado do Mapper
    expect(resultado).toStrictEqual({
      dispositivos: [
        {
          id: 'esp32-01',
          nome: 'Sensor DHT22',
          ambienteId: 'ambiente-frio-123',
        },
      ],
    })
  })

  it('deve lidar corretamente e retornar uma lista vazia se nenhum dispositivo for encontrado', async () => {
    // Arrange: Configura o banco de dados para retornar vazio
    vi.spyOn(dispositivoRepositoryMock, 'findAll').mockResolvedValueOnce([])

    // Altera temporariamente o retorno do mock do Mapper para este cenário específico
    vi.spyOn(ListarDispositivosMapper, 'paraOutput').mockReturnValueOnce({ dispositivos: [] })

    // Act
    const resultado = await useCase.execute()

    // Assert
    expect(dispositivoRepositoryMock.findAll).toHaveBeenCalledTimes(1)
    expect(ListarDispositivosMapper.paraOutput).toHaveBeenCalledWith([])
    expect(resultado).toStrictEqual({ dispositivos: [] })
  })

  it('deve propagar a exceção caso a consulta ao repositório falhe', async () => {
    // Arrange: Força o banco de dados a estourar uma falha
    vi.spyOn(dispositivoRepositoryMock, 'findAll').mockRejectedValueOnce(
      new Error('Erro de conexão com o banco'),
    )

    // Act & Assert
    await expect(useCase.execute()).rejects.toThrow('Erro de conexão com o banco')

    // Se o banco falhar, o fluxo é interrompido imediatamente e o Mapper não é executado
    expect(ListarDispositivosMapper.paraOutput).not.toHaveBeenCalled()
  })
})
