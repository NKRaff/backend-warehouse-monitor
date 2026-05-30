import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AlertaRepository } from '../../../domain/alerta/alerta.repository.js'
import type { NotificacaoRepository } from '../../../domain/notificacao/notificacao.repository.js'
import type { ListarNotificacaoDoUsuarioInputDto } from '../dtos/listar-notificacao-do-usuario.dto.js'
import { ListarNotificacaoDoUsuarioMapper } from '../mappers/listar-notificacao-do-usuario.mapper.js'
import { ListarNotificacaoDoUsuarioUseCase } from './listar-notificacao-do-usuario.usecase.js'

// 1. Mockando o Mapper para isolar completamente o Use Case
vi.mock('../mappers/listar-notificacao-do-usuario.mapper.js', () => ({
  ListarNotificacaoDoUsuarioMapper: {
    paraOutput: vi.fn(),
  },
}))

describe('ListarNotificacaoDoUsuarioUseCase Unit Tests', () => {
  let alertaRepositoryMock: AlertaRepository
  let notificacaoRepositoryMock: NotificacaoRepository
  let useCase: ListarNotificacaoDoUsuarioUseCase

  let notificacaoEntityMock: any
  let alertaEntityMock: any

  const inputValido: ListarNotificacaoDoUsuarioInputDto = {
    usuarioId: 'usuario-123',
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock da entidade de Notificacao
    notificacaoEntityMock = {
      id: 'notificacao-01',
      alertaId: 'alerta-999',
      usuarioId: 'usuario-123',
      lida: false,
    }

    // Mock da entidade de Alerta
    alertaEntityMock = {
      id: 'alerta-999',
      dispositivoId: 'sensor-xyz',
      ambienteId: 'sala-01',
      tipo: 'temperatura',
      nivel: 'critico',
      mensagem: 'Temperatura muito alta',
    }

    // Configurando mocks dos repositórios
    notificacaoRepositoryMock = {
      findByUsuario: vi.fn().mockResolvedValue([notificacaoEntityMock]),
    } as unknown as NotificacaoRepository

    alertaRepositoryMock = {
      findById: vi.fn().mockResolvedValue(alertaEntityMock),
    } as unknown as AlertaRepository

    useCase = ListarNotificacaoDoUsuarioUseCase.create(
      alertaRepositoryMock,
      notificacaoRepositoryMock,
    )
  })

  it('deve buscar as notificações, os alertas correspondentes, chamar o mapper e retornar o output', async () => {
    // Arrange
    const outputEsperado = {
      notificoes: [
        {
          id: 'notificacao-01',
          dispositivoId: 'sensor-xyz',
          mensagem: 'Temperatura muito alta',
        },
      ],
    }
    vi.mocked(ListarNotificacaoDoUsuarioMapper.paraOutput).mockReturnValueOnce(
      outputEsperado as any,
    )

    // Act
    const resultado = await useCase.execute(inputValido)

    // Assert
    // 1. Verifica se buscou as notificações do usuário
    expect(notificacaoRepositoryMock.findByUsuario).toHaveBeenCalledTimes(1)
    expect(notificacaoRepositoryMock.findByUsuario).toHaveBeenCalledWith('usuario-123')

    // 2. Verifica se buscou o alerta referenciado na notificação
    expect(alertaRepositoryMock.findById).toHaveBeenCalledTimes(1)
    expect(alertaRepositoryMock.findById).toHaveBeenCalledWith('alerta-999')

    // 3. Verifica se o mapper foi chamado com as listas corretas
    expect(ListarNotificacaoDoUsuarioMapper.paraOutput).toHaveBeenCalledTimes(1)
    expect(ListarNotificacaoDoUsuarioMapper.paraOutput).toHaveBeenCalledWith(
      [notificacaoEntityMock],
      [alertaEntityMock],
    )

    // 4. Verifica o resultado final
    expect(resultado).toStrictEqual(outputEsperado)
  })

  it('deve retornar uma lista vazia caso o usuário não possua notificações', async () => {
    // Arrange
    vi.spyOn(notificacaoRepositoryMock, 'findByUsuario').mockResolvedValueOnce([])
    vi.mocked(ListarNotificacaoDoUsuarioMapper.paraOutput).mockReturnValueOnce({ notificoes: [] })

    // Act
    const resultado = await useCase.execute(inputValido)

    // Assert
    expect(notificacaoRepositoryMock.findByUsuario).toHaveBeenCalledWith('usuario-123')
    expect(alertaRepositoryMock.findById).not.toHaveBeenCalled() // Não deve buscar alertas se não há notificações
    expect(ListarNotificacaoDoUsuarioMapper.paraOutput).toHaveBeenCalledWith([], [])
    expect(resultado).toStrictEqual({ notificoes: [] })
  })

  it('deve repassar exceção se o repositório de notificações falhar', async () => {
    // Arrange
    vi.spyOn(notificacaoRepositoryMock, 'findByUsuario').mockRejectedValueOnce(
      new Error('Erro no banco de dados de notificações'),
    )

    // Act & Assert
    await expect(useCase.execute(inputValido)).rejects.toThrow(
      'Erro no banco de dados de notificações',
    )
    expect(alertaRepositoryMock.findById).not.toHaveBeenCalled()
    expect(ListarNotificacaoDoUsuarioMapper.paraOutput).not.toHaveBeenCalled()
  })

  it('deve repassar exceção se o repositório de alertas falhar', async () => {
    // Arrange
    vi.spyOn(alertaRepositoryMock, 'findById').mockRejectedValueOnce(
      new Error('Erro no banco de dados de alertas'),
    )

    // Act & Assert
    await expect(useCase.execute(inputValido)).rejects.toThrow('Erro no banco de dados de alertas')
    expect(notificacaoRepositoryMock.findByUsuario).toHaveBeenCalled()
    expect(ListarNotificacaoDoUsuarioMapper.paraOutput).not.toHaveBeenCalled()
  })

  it('deve repassar exceção se o Mapper lançar um erro', async () => {
    // Arrange
    vi.mocked(ListarNotificacaoDoUsuarioMapper.paraOutput).mockImplementationOnce(() => {
      throw new Error('Notificacoes invalidas')
    })

    // Act & Assert
    await expect(useCase.execute(inputValido)).rejects.toThrow('Notificacoes invalidas')
    expect(notificacaoRepositoryMock.findByUsuario).toHaveBeenCalled()
    expect(alertaRepositoryMock.findById).toHaveBeenCalled()
  })
})
