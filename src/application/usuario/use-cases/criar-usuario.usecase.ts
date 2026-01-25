import type { UseCase } from '@/application/usecase.js'
import { Usuario } from '@/domain/usuario/usuario.entity.js'
import type { UsuarioRepository } from '@/domain/usuario/usuario.repository.js'
import { v7 } from 'uuid'
import type { CriarUsuarioInputDto, CriarUsuarioOutputDto } from '../dtos/criar-usuario.dto.js'
import { CriarUsuarioMapper } from '../mappers/criar-usuario.mapper.js'

export class CriarUsuarioUseCase implements UseCase<CriarUsuarioInputDto, CriarUsuarioOutputDto> {
  private constructor(private readonly usuarioRepo: UsuarioRepository) {}

  public static create(usuarioRepo: UsuarioRepository) {
    return new CriarUsuarioUseCase(usuarioRepo)
  }

  public async execute(input: CriarUsuarioInputDto): Promise<CriarUsuarioOutputDto> {
    const usuario = Usuario.create(v7(), input.nome, input.email)
    await this.usuarioRepo.save(usuario)
    const output = CriarUsuarioMapper.paraOutput(usuario)
    return output
  }
}
