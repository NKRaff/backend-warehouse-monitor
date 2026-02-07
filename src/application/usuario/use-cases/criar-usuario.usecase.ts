import type { UseCase } from '@/application/usecase.js'
import { Autenticacao } from '@/domain/autenticacao/autenticacao.entity.js'
import type { AutenticacaoRepository } from '@/domain/autenticacao/autenticacao.repository.js'
import { Usuario } from '@/domain/usuario/usuario.entity.js'
import type { UsuarioRepository } from '@/domain/usuario/usuario.repository.js'
import { hash } from 'bcrypt'
import { v7 } from 'uuid'
import type { CriarUsuarioInputDto, CriarUsuarioOutputDto } from '../dtos/criar-usuario.dto.js'
import { CriarUsuarioMapper } from '../mappers/criar-usuario.mapper.js'

export class CriarUsuarioUseCase implements UseCase<CriarUsuarioInputDto, CriarUsuarioOutputDto> {
  private constructor(
    private readonly usuarioRepo: UsuarioRepository,
    private readonly autenticacaoRepo: AutenticacaoRepository,
  ) {}

  public static create(usuarioRepo: UsuarioRepository, autenticacaoRepo: AutenticacaoRepository) {
    return new CriarUsuarioUseCase(usuarioRepo, autenticacaoRepo)
  }

  public async execute(input: CriarUsuarioInputDto): Promise<CriarUsuarioOutputDto> {
    const senhaHash = await hash(input.senha, Number(process.env.BCRYPT_SALT))
    const usuario = Usuario.create(v7(), input.nome, input.email, input.receberEmail)
    const autenticacao = Autenticacao.create(v7(), usuario.id, senhaHash)
    await this.usuarioRepo.save(usuario)
    await this.autenticacaoRepo.save(autenticacao)
    const output = CriarUsuarioMapper.paraOutput(usuario)
    return output
  }
}
