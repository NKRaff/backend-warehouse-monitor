import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Autenticacao } from '../../../domain/autenticacao/autenticacao.entity.js'
import type { AutenticacaoRepository } from '../../../domain/autenticacao/autenticacao.repository.js'
import { Usuario } from '../../../domain/usuario/usuario.entity.js'
import type { UsuarioRepository } from '../../../domain/usuario/usuario.repository.js'
import type { CriarUsuarioInputDto } from '../dtos/criar-usuario.dto.js'
import { CriarUsuarioUseCase } from './criar-usuario.usecase.js' // Ajuste o caminho se necessário

// 1. Mockando a biblioteca bcrypt externa para evitar lentidão e processamento real de hash
vi.mock('bcrypt', () => ({
  hash: vi.fn().mockResolvedValue('senha_criptografada_mock_123'),
}))

// 2. Mockando o Mapper para isolar o Use Case de transformações estruturais de saída
vi.mock('../mappers/criar-usuario.mapper.js', () => ({
  CriarUsuarioMapper: {
    paraOutput: vi.fn().mockImplementation((usuario) => ({ id: usuario.id })),
  },
}))

import { hash } from 'bcrypt'
import { CriarUsuarioMapper } from '../mappers/criar-usuario.mapper.js'

describe('CriarUsuarioUseCase Unit Tests', () => {
  let usuarioRepositoryMock: UsuarioRepository
  let autenticacaoRepositoryMock: AutenticacaoRepository
  let useCase: CriarUsuarioUseCase

  const inputValido: CriarUsuarioInputDto = {
    nome: 'Rafael Rocha',
    email: 'rafael@dev.com',
    senha: 'senhaSuperSegura123',
    receberEmail: true,
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Configurando a variável de ambiente necessária para o Bcrypt
    process.env.BCRYPT_SALT = '10'

    // Instanciando mocks vazios para os métodos de persistência
    usuarioRepositoryMock = {
      save: vi.fn().mockResolvedValue(undefined),
    } as unknown as UsuarioRepository

    autenticacaoRepositoryMock = {
      save: vi.fn().mockResolvedValue(undefined),
    } as unknown as AutenticacaoRepository

    // Espionando e controlando as fábricas de domínio para retornar objetos simulados controláveis
    vi.spyOn(Usuario, 'create').mockReturnValue({
      id: 'mocked-user-uuid-v7',
      nome: 'Rafael Rocha',
      email: 'rafael@dev.com',
      receberEmail: true,
    } as any)

    vi.spyOn(Autenticacao, 'create').mockReturnValue({
      id: 'mocked-auth-uuid-v7',
      usuarioId: 'mocked-user-uuid-v7',
      senhaHash: 'senha_criptografada_mock_123',
    } as any)

    useCase = CriarUsuarioUseCase.create(usuarioRepositoryMock, autenticacaoRepositoryMock)
  })

  it('deve gerar o hash da senha, criar as entidades de domínio, persistir no banco e retornar o id com sucesso', async () => {
    // Act
    const resultado = await useCase.execute(inputValido)

    // Assert
    // 1. Garante que o Bcrypt foi acionado com a senha correta e o salt vindo do ambiente
    expect(hash).toHaveBeenCalledTimes(1)
    expect(hash).toHaveBeenCalledWith('senhaSuperSegura123', 10)

    // 2. Garante que as entidades de domínio foram geradas a partir do input fornecido
    expect(Usuario.create).toHaveBeenCalledWith(
      expect.any(String), // UUID v7 gerado internamente
      'Rafael Rocha',
      'rafael@dev.com',
      true,
    )
    expect(Autenticacao.create).toHaveBeenCalledWith(
      expect.any(String), // UUID v7 gerado internamente
      'mocked-user-uuid-v7',
      'senha_criptografada_mock_123',
    )

    // 3. Garante que ambos os repositórios foram acionados para salvar as respectivas entidades
    expect(usuarioRepositoryMock.save).toHaveBeenCalledTimes(1)
    expect(autenticacaoRepositoryMock.save).toHaveBeenCalledTimes(1)

    // 4. Garante a execução do Mapper e a estrutura de saída íntegra
    expect(CriarUsuarioMapper.paraOutput).toHaveBeenCalledTimes(1)
    expect(resultado).toStrictEqual({ id: 'mocked-user-uuid-v7' })
  })

  it('deve propagar o erro e interromper a cadeia se a geração do hash do bcrypt falhar', async () => {
    // Arrange: força o Bcrypt a quebrar por algum motivo interno
    vi.mocked(hash).mockRejectedValueOnce(new Error('Falha interna do ecossistema crypto'))

    // Act & Assert
    await expect(useCase.execute(inputValido)).rejects.toThrow(
      'Falha interna do ecossistema crypto',
    )

    // Garantia de atomicidade: se falhou antes, nada é instanciado ou persistido no banco
    expect(Usuario.create).not.toHaveBeenCalled()
    expect(usuarioRepositoryMock.save).not.toHaveBeenCalled()
    expect(autenticacaoRepositoryMock.save).not.toHaveBeenCalled()
  })

  it('deve propagar a exceção caso o salvamento do usuário quebre no banco de dados', async () => {
    // Arrange: simula um erro de chave duplicada ou falha na tabela de Usuários
    vi.spyOn(usuarioRepositoryMock, 'save').mockRejectedValueOnce(
      new Error('Erro de persistência de dados'),
    )

    // Act & Assert
    await expect(useCase.execute(inputValido)).rejects.toThrow('Erro de persistência de dados')

    // Verificação de fluxo: tentou salvar o usuário, mas o fluxo quebrou antes de persistir as credenciais de autenticação
    expect(usuarioRepositoryMock.save).toHaveBeenCalled()
    expect(autenticacaoRepositoryMock.save).not.toHaveBeenCalled()
  })
})
