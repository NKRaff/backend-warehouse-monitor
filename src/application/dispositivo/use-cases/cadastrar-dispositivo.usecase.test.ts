import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { DispositivoRepository } from '../../../domain/dispositivo/despositivo.repository.js'
import { Dispositivo } from '../../../domain/dispositivo/dispositivo.entity.js'
import type { SubscriberTopic } from '../../../domain/medicao/subscriber.repository.js'
import type { CadastrarDispositivoInputDto } from '../dtos/cadastrar-dispositivo.dto.js'
import { CadastrarDispositivoUseCase } from './cadastrar-dispositivo.usecase.js' // Ajuste o caminho se necessário

// 1. Mockando o Mapper para isolar completamente o Use Case
vi.mock('../mappers/cadastrar-dispositivo.mapper.js', () => ({
  CadastrarDispositivoMapper: {
    paraOutput: vi.fn().mockReturnValue({ id: 'esp32-fungisense-01' }),
  },
}))

import { CadastrarDispositivoMapper } from '../mappers/cadastrar-dispositivo.mapper.js'

describe('CadastrarDispositivoUseCase Unit Tests', () => {
  let dispositivoRepositoryMock: DispositivoRepository
  let subscriberTopicMock: SubscriberTopic
  let useCase: CadastrarDispositivoUseCase

  const inputValido: CadastrarDispositivoInputDto = {
    id: 'esp32-fungisense-01',
    nome: 'Sensor DHT22 - Galpão A',
    ambienteId: 'ambiente-id-999',
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock do repositório de persistência
    dispositivoRepositoryMock = {
      save: vi.fn().mockResolvedValue(undefined),
    } as unknown as DispositivoRepository

    // Mock do serviço de mensageria/MQTT (Subscriber)
    subscriberTopicMock = {
      dispositivoSubscribe: vi.fn().mockResolvedValue(undefined),
    } as unknown as SubscriberTopic

    useCase = CadastrarDispositivoUseCase.create(dispositivoRepositoryMock, subscriberTopicMock)
  })

  it('deve cadastrar um dispositivo com sucesso, salvar no banco, assinar o tópico e retornar o id', async () => {
    // Act
    const resultado = await useCase.execute(inputValido)

    // Assert
    // 1. Garante que salvou a entidade Dispositivo no repositório
    expect(dispositivoRepositoryMock.save).toHaveBeenCalledTimes(1)
    expect(dispositivoRepositoryMock.save).toHaveBeenCalledWith(expect.any(Dispositivo))

    // 2. IMPORTANTE: Garante que o serviço de mensageria assinou o tópico com o ID correto do dispositivo
    expect(subscriberTopicMock.dispositivoSubscribe).toHaveBeenCalledTimes(1)
    expect(subscriberTopicMock.dispositivoSubscribe).toHaveBeenCalledWith('esp32-fungisense-01')

    // 3. Garante a delegação para o mapper de output
    expect(CadastrarDispositivoMapper.paraOutput).toHaveBeenCalledWith(expect.any(Dispositivo))

    // 4. Verifica o retorno esperado
    expect(resultado).toStrictEqual({ id: 'esp32-fungisense-01' })
  })

  it('deve repassar a exceção e não assinar o tópico se o repositório falhar ao salvar', async () => {
    // Arrange: Simula uma falha na gravação do banco de dados
    vi.spyOn(dispositivoRepositoryMock, 'save').mockRejectedValueOnce(
      new Error('Erro ao salvar no banco'),
    )

    // Act & Assert
    await expect(useCase.execute(inputValido)).rejects.toThrow('Erro ao salvar no banco')

    // Se o banco falhou, a aplicação não deve tentar assinar o tópico MQTT (evita inconsistência)
    expect(subscriberTopicMock.dispositivoSubscribe).not.toHaveBeenCalled()
    expect(CadastrarDispositivoMapper.paraOutput).not.toHaveBeenCalled()
  })

  it('deve repassar a exceção se a assinatura do tópico falhar', async () => {
    // Arrange: O banco salva com sucesso, mas a integração com o broker/subscriber falha
    vi.spyOn(subscriberTopicMock, 'dispositivoSubscribe').mockRejectedValueOnce(
      new Error('Falha na conexão MQTT'),
    )

    // Act & Assert
    await expect(useCase.execute(inputValido)).rejects.toThrow('Falha na conexão MQTT')

    // O banco foi chamado com sucesso antes do erro acontecer
    expect(dispositivoRepositoryMock.save).toHaveBeenCalledTimes(1)

    // O mapper não deve processar a saída já que a operação estourou um erro no meio
    expect(CadastrarDispositivoMapper.paraOutput).not.toHaveBeenCalled()
  })
})
