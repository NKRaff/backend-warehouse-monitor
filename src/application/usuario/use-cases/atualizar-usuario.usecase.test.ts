import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { UsuarioRepository } from '../../../domain/usuario/usuario.repository.js'
import type { AtualizarUsuarioInputDto } from '../dtos/atualizar-usuario.dto.js'
import { AtualizarUsuarioUseCase } from './atualizar-usuario.usecase.js' // Ajuste o caminho se necessário

// 1. Mockando o Mapper para isolar completamente o Use Case
vi.mock('../mappers/atualizar-usuario.mapper.js', () => ({
  AtualizarUsuarioMapper: {
    paraOutput: vi.fn().mockImplementation((usuario) => ({ id: usuario.id })),
  },
}))

import { AtualizarUsuarioMapper } from '../mappers/atualizar-usuario.mapper.js'

describe('AtualizarUsuarioUseCase Unit Tests', () => {
  let usuarioRepositoryMock: UsuarioRepository
  let useCase: AtualizarUsuarioUseCase
  let usuarioEntityMock: any

  const inputValido: AtualizarUsuarioInputDto = {
    id: 'user-id-abc',
    nome: 'Rafael Rocha Atualizado',
    email: 'rafael.atualizado@dev.com',
    receberEmail: true,
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock da entidade de domínio com o método mutador herdado ou definido na classe
    usuarioEntityMock = {
      id: 'user-id-abc',
      nome: 'Rafael Rocha',
      email: 'rafael@dev.com',
      receberEmail: false,
      update: vi.fn().mockImplementation(function (this: any, nome, email, receberEmail) {
        this.nome = nome
        this.email = email
        this.receberEmail = receberEmail
      }),
    }

    // Configurando o mock do repositório
    usuarioRepositoryMock = {
      findById: vi.fn().mockResolvedValue(usuarioEntityMock),
      update: vi.fn().mockResolvedValue(undefined),
    } as unknown as UsuarioRepository

    useCase = AtualizarUsuarioUseCase.create(usuarioRepositoryMock)
  })

  it('deve atualizar os dados do usuário com sucesso, persistir e retornar o id mapeado', async () => {
    // Act
    const resultado = await useCase.execute(inputValido)

    // Assert
    // 1. Garante que o usuário foi buscado corretamente pelo id informado
    expect(usuarioRepositoryMock.findById).toHaveBeenCalledTimes(1)
    expect(usuarioRepositoryMock.findById).toHaveBeenCalledWith('user-id-abc')

    // 2. Garante que os novos dados do DTO foram passados para o método de domínio
    expect(usuarioEntityMock.update).toHaveBeenCalledTimes(1)
    expect(usuarioEntityMock.update).toHaveBeenCalledWith(
      'Rafael Rocha Atualizado',
      'rafael.atualizado@dev.com',
      true,
    )

    // 3. Garante que a entidade modificada foi enviada para o método de persistência
    expect(usuarioRepositoryMock.update).toHaveBeenCalledTimes(1)
    expect(usuarioRepositoryMock.update).toHaveBeenCalledWith(usuarioEntityMock)

    // 4. Garante que o Mapper foi acionado com o objeto atualizado
    expect(AtualizarUsuarioMapper.paraOutput).toHaveBeenCalledTimes(1)
    expect(AtualizarUsuarioMapper.paraOutput).toHaveBeenCalledWith(usuarioEntityMock)

    // 5. Verifica se o formato do retorno bate com o esperado
    expect(resultado).toStrictEqual({ id: 'user-id-abc' })
  })

  it('deve lançar erro e não executar nenhuma operação se o usuário não for encontrado', async () => {
    // Arrange: Simula que o usuário não existe no banco de dados
    vi.spyOn(usuarioRepositoryMock, 'findById').mockResolvedValueOnce(null as any)

    // Act & Assert
    await expect(useCase.execute(inputValido)).rejects.toThrow('Usuario não encontrado')

    // A barreira funcionou: o método update da entidade e a persistência não devem ser chamados
    expect(usuarioRepositoryMock.update).not.toHaveBeenCalled()
    expect(AtualizarUsuarioMapper.paraOutput).not.toHaveBeenCalled()
  })

  it('deve propagar o erro caso a persistência do repositório falhe', async () => {
    // Arrange: Passa pela busca e pela mutação, mas falha na atualização física do banco
    vi.spyOn(usuarioRepositoryMock, 'update').mockRejectedValueOnce(
      new Error('Falha catastrófica no banco de dados'),
    )

    // Act & Assert
    await expect(useCase.execute(inputValido)).rejects.toThrow(
      'Falha catastrófica no banco de dados',
    )

    // Certifica que o fluxo de validação rodou até o momento imediatamente anterior à falha
    expect(usuarioRepositoryMock.findById).toHaveBeenCalledWith('user-id-abc')
    expect(usuarioEntityMock.update).toHaveBeenCalled()
    expect(AtualizarUsuarioMapper.paraOutput).not.toHaveBeenCalled()
  })
})
