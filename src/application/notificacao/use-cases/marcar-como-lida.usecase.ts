import type { NotificacaoRepository } from '../../../domain/notificacao/notificacao.repository.js'
import type { UseCase } from '../../usecase.js'
import type {
  MarcarComoLidaInputDto,
  MarcarComoLidaOutputDto,
} from '../dtos/marcar-como-lida.dto.js'

export class MarcarComoLidaUseCase
  implements UseCase<MarcarComoLidaInputDto, MarcarComoLidaOutputDto>
{
  private constructor(private readonly notificacaoRepo: NotificacaoRepository) {}

  public static create(notificacaoRepo: NotificacaoRepository) {
    return new MarcarComoLidaUseCase(notificacaoRepo)
  }

  public async execute(input: MarcarComoLidaInputDto): Promise<void> {
    const notificacao = await this.notificacaoRepo.findById(input.notificacaoId)
    if (!notificacao) throw new Error('Notificação não foi encontrada')
    notificacao.marcarComoLida()
    await this.notificacaoRepo.updateLida(input.notificacaoId, notificacao)
  }
}
