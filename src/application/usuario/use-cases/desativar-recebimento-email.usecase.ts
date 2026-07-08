import type { UsuarioRepository } from '../../../domain/usuario/usuario.repository.js'
import type { UseCase } from '../../usecase.js'
import type {
  RecebimentoEmailInputDto,
  RecebimentoEmailOutputDto,
} from '../dtos/recebimento-email.dto.js'

export class DesativarRecebimentoEmailUseCase
  implements UseCase<RecebimentoEmailInputDto, RecebimentoEmailOutputDto>
{
  private constructor(private readonly usuarioRepo: UsuarioRepository) {}

  public static create(usuarioRepo: UsuarioRepository) {
    return new DesativarRecebimentoEmailUseCase(usuarioRepo)
  }

  public async execute(input: RecebimentoEmailInputDto): Promise<void> {
    const usuario = await this.usuarioRepo.findById(input.id)
    if (!usuario) throw new Error('Usuario não encontrado')
    usuario.desativarRecebimentoDeEmail()
    await this.usuarioRepo.updateRecebimentoEmail(input.id, usuario)
  }
}
