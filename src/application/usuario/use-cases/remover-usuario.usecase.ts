import type { UseCase } from '@/application/usecase.js'
import type { UsuarioRepository } from '@/domain/usuario/usuario.repository.js'
import type {
  RemoverUsuarioInputDto,
  RemoverUsuarioOutputDto,
} from '../dtos/remover-usuario.dto.js'

export class RemoverUsuarioUseCase
  implements UseCase<RemoverUsuarioInputDto, RemoverUsuarioOutputDto>
{
  private constructor(private readonly usuarioRepo: UsuarioRepository) {}

  public static create(usuarioRepo: UsuarioRepository) {
    return new RemoverUsuarioUseCase(usuarioRepo)
  }

  public async execute(input: RemoverUsuarioInputDto): Promise<void> {
    const usuario = this.usuarioRepo.findById(input.id)
    if (!usuario) throw new Error('Não é possivel remover usuario: esse usuario não existe')
    await this.usuarioRepo.delete(input.id)
  }
}
