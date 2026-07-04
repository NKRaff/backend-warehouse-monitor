import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { UsuarioRepository } from '../../../domain/usuario/usuario.repository.js'
import type { BuscarUsuarioInputDto } from '../dtos/buscar-usuario.dto.js'
import { BuscarUsuarioUseCase } from './buscar-usuario.usecase.js'

// 1. Mockando o Mapper para isolar completamente o Use Case
vi.mock('../mappers/buscar-usuario.mapper.js', () => ({
  BuscarUsuarioMapper: {
    paraOutput: vi.fn().mockImplementation((usuario) => ({
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      receberEmail: usuario.receberEmail,
    })),
  },
}))

import { BuscarUsuarioMapper } from '../mappers/buscar-usuario.mapper.js'

describe('BuscarUsuarioUseCase Unit Tests', () => {
  let usuarioRepositoryMock: UsuarioRepository
  let useCase: BuscarUsuarioUseCase
  let usuarioEntityMock: any

  const inputValido: BuscarUsuarioInputDto = {
    id: 'user-id-abc',
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock da entidade de domínio que será retornada pelo repositório
    usuarioEntityMock = {
      id: 'user-id-abc',
      nome: 'Rafael Rocha',
      email: 'rafael@dev.com',
      receberEmail: false,
    }

    // Configurando o mock do repositório
    usuarioRepositoryMock = {
      findById: vi.fn().mockResolvedValue(usuarioEntityMock),
    } as unknown as UsuarioRepository

    useCase = BuscarUsuarioUseCase.create(usuarioRepositoryMock)
  })

  it('deve buscar um usuário com sucesso, passar pelo mapper e retornar os dados', async () => {
    // Act
    const resultado = await useCase.execute(inputValido)

    // Assert
    // 1. Garante que o usuário foi buscado corretamente pelo id informado
    expect(usuarioRepositoryMock.findById).toHaveBeenCalledTimes(1)
    expect(usuarioRepositoryMock.findById).toHaveBeenCalledWith('user-id-abc')

    // 2. Garante que o Mapper foi acionado com o objeto retornado do repositório
    expect(BuscarUsuarioMapper.paraOutput).toHaveBeenCalledTimes(1)
    expect(BuscarUsuarioMapper.paraOutput).toHaveBeenCalledWith(usuarioEntityMock)

    // 3. Verifica se o formato e dados do retorno batem com o mock do mapper
    expect(resultado).toStrictEqual({
      id: 'user-id-abc',
      nome: 'Rafael Rocha',
      email: 'rafael@dev.com',
      receberEmail: false,
    })
  })

  it('deve lançar erro se o usuário não for encontrado', async () => {
    // Arrange: Simula que o usuário não existe no repositório
    vi.spyOn(usuarioRepositoryMock, 'findById').mockResolvedValueOnce(null as any)

    // Act & Assert
    await expect(useCase.execute(inputValido)).rejects.toThrow('Usuario não encontrado')

    // O Mapper não deve ser chamado se o usuário for nulo
    expect(BuscarUsuarioMapper.paraOutput).not.toHaveBeenCalled()
  })

  it('deve propagar o erro caso o repositório falhe na busca', async () => {
    // Arrange: Força uma falha na comunicação com o banco/infraestrutura
    vi.spyOn(usuarioRepositoryMock, 'findById').mockRejectedValueOnce(
      new Error('Erro de conexão com o banco de dados'),
    )

    // Act & Assert
    await expect(useCase.execute(inputValido)).rejects.toThrow(
      'Erro de conexão com o banco de dados',
    )

    // Certifica que o fluxo travou antes de chegar no Mapper
    expect(BuscarUsuarioMapper.paraOutput).not.toHaveBeenCalled()
  })
})
