import type { UseCase } from '@/application/usecase.js'
import type { UsuarioRepository } from '@/domain/usuario/usuario.repository.js'
import type {
  RecebimentoEmailInputDto,
  RecebimentoEmailOutputDto,
} from '../dtos/recebimento-email.dto.js'

export class AtivarRecebimentoEmailUseCase
  implements UseCase<RecebimentoEmailInputDto, RecebimentoEmailOutputDto>
{
  private constructor(private readonly usuarioRepo: UsuarioRepository) {}

  public static create(usuarioRepo: UsuarioRepository) {
    return new AtivarRecebimentoEmailUseCase(usuarioRepo)
  }

  public async execute(input: RecebimentoEmailInputDto): Promise<void> {
    const usuario = await this.usuarioRepo.findById(input.id)
    if (!usuario) throw new Error('Usuario não encontrado')
    usuario.ativarRecebimentoDeEmail()
    await this.usuarioRepo.updateRecebimentoEmail(input.id, usuario)
  }
}
