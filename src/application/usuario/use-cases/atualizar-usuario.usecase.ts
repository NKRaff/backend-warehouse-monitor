import type { UseCase } from '@/application/usecase.js'
import type { UsuarioRepository } from '@/domain/usuario/usuario.repository.js'
import type {
  AtualizarUsuarioInputDto,
  AtualizarUsuarioOutputDto,
} from '../dtos/atualizar-usuario.dto.js'
import { AtualizarUsuarioMapper } from '../mappers/atualizar-usuario.mapper.js'

export class AtualizarUsuarioUseCase
  implements UseCase<AtualizarUsuarioInputDto, AtualizarUsuarioOutputDto>
{
  private constructor(private readonly usuarioRepo: UsuarioRepository) {}

  public static create(usuarioRepo: UsuarioRepository) {
    return new AtualizarUsuarioUseCase(usuarioRepo)
  }

  public async execute(input: AtualizarUsuarioInputDto): Promise<AtualizarUsuarioOutputDto> {
    const usuario = await this.usuarioRepo.findById(input.id)
    if (!usuario) throw new Error('Usuario não encontrado')

    usuario.update(input.nome, input.email, input.receberEmail)
    await this.usuarioRepo.update(usuario)

    const output = AtualizarUsuarioMapper.paraOutput(usuario)
    return output
  }
}
