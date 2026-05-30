import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { DispositivoRepository } from '../../../domain/dispositivo/despositivo.repository.js'
import type { AtualizarDispositivoInputDto } from '../dtos/atualizar-dispositivo.dto.js'
import { AtualizarDispositivoUseCase } from './atualizar-dispositivo.usecase.js' // Ajuste o caminho se necessário

// 1. Mockando o Mapper para isolar completamente o Use Case
vi.mock('../mappers/atualizar-dispositivo.mapper.js', () => ({
  AtualizarDispositivoMapper: {
    paraOutput: vi.fn().mockReturnValue({ id: 'dispositivo-id-123' }),
  },
}))

import { AtualizarDispositivoMapper } from '../mappers/atualizar-dispositivo.mapper.js'

describe('AtualizarDispositivoUseCase Unit Tests', () => {
  let dispositivoRepositoryMock: DispositivoRepository
  let useCase: AtualizarDispositivoUseCase
  let dispositivoEntityMock: any

  const inputValido: AtualizarDispositivoInputDto = {
    id: 'dispositivo-id-123',
    nome: 'Sensor de Temperatura Alterado',
    ambienteId: 'ambiente-novo-id',
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Criando um mock da entidade Dispositivo espionando o método .update() do domínio
    dispositivoEntityMock = {
      id: 'dispositivo-id-123',
      update: vi.fn(),
    }

    // Configurando o mock do repositório
    dispositivoRepositoryMock = {
      findById: vi.fn().mockResolvedValue(dispositivoEntityMock),
      update: vi.fn().mockResolvedValue(undefined),
    } as unknown as DispositivoRepository

    useCase = AtualizarDispositivoUseCase.create(dispositivoRepositoryMock)
  })

  it('deve atualizar o dispositivo com sucesso, salvar e chamar o mapper', async () => {
    // Act
    const resultado = await useCase.execute(inputValido)

    // Assert
    // 1. Verifica se buscou o dispositivo correto pelo ID
    expect(dispositivoRepositoryMock.findById).toHaveBeenCalledWith('dispositivo-id-123')

    // 2. Garante que o caso de uso delegou as mudanças para as regras de negócio da entidade
    expect(dispositivoEntityMock.update).toHaveBeenCalledWith(
      inputValido.nome,
      inputValido.ambienteId,
    )

    // 3. Garante que o estado modificado foi salvo de volta no repositório
    expect(dispositivoRepositoryMock.update).toHaveBeenCalledWith(dispositivoEntityMock)

    // 4. Valida a execução do mapper e o payload final de saída (apenas o id, conforme seu contrato)
    expect(AtualizarDispositivoMapper.paraOutput).toHaveBeenCalledWith(dispositivoEntityMock)
    expect(resultado).toStrictEqual({ id: 'dispositivo-id-123' })
  })

  it('deve lançar erro se o dispositivo não for encontrado no banco de dados', async () => {
    // Arrange: Simula que o dispositivo com o ID especificado não existe (retorna null)
    vi.spyOn(dispositivoRepositoryMock, 'findById').mockResolvedValueOnce(null as any)

    // Act & Assert
    await expect(useCase.execute(inputValido)).rejects.toThrow(
      'Não é possível atualizar dispositivo: não existe dispositivo associado a esse id.',
    )

    // Verificações de segurança de barreira (guard clause): nada subsequente deve rodar
    expect(dispositivoEntityMock.update).not.toHaveBeenCalled()
    expect(dispositivoRepositoryMock.update).not.toHaveBeenCalled()
    expect(AtualizarDispositivoMapper.paraOutput).not.toHaveBeenCalled()
  })

  it('deve repassar a exceção caso o repositório falhe na persistência do update', async () => {
    // Arrange: Força o método update do repositório a lançar um erro
    vi.spyOn(dispositivoRepositoryMock, 'update').mockRejectedValueOnce(
      new Error('Erro interno do banco'),
    )

    // Act & Assert
    await expect(useCase.execute(inputValido)).rejects.toThrow('Erro interno do banco')

    // O Mapper não deve processar se o banco de dados falhar no salvamento
    expect(AtualizarDispositivoMapper.paraOutput).not.toHaveBeenCalled()
  })
})
