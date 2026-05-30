import type { AlertaRepository } from '../../../domain/alerta/alerta.repository.js'
import type { NotificacaoRepository } from '../../../domain/notificacao/notificacao.repository.js'
import type { UseCase } from '../../usecase.js'
import type {
  ListarNotificacaoDoUsuarioInputDto,
  ListarNotificacaoDoUsuarioOutputDto,
} from '../dtos/listar-notificacao-do-usuario.dto.js'
import { ListarNotificacaoDoUsuarioMapper } from '../mappers/listar-notificacao-do-usuario.mapper.js'

export class ListarNotificacaoDoUsuarioUseCase
  implements UseCase<ListarNotificacaoDoUsuarioInputDto, ListarNotificacaoDoUsuarioOutputDto>
{
  private constructor(
    private readonly alertaRepo: AlertaRepository,
    private readonly notificacaoRepo: NotificacaoRepository,
  ) {}

  public static create(alertaRepo: AlertaRepository, notificacaoRepo: NotificacaoRepository) {
    return new ListarNotificacaoDoUsuarioUseCase(alertaRepo, notificacaoRepo)
  }

  public async execute(
    input: ListarNotificacaoDoUsuarioInputDto,
  ): Promise<ListarNotificacaoDoUsuarioOutputDto> {
    const listaNotificoes = await this.notificacaoRepo.findByUsuario(input.usuarioId)
    const listaAlertas = await Promise.all(
      listaNotificoes.map((notificacao) => this.alertaRepo.findById(notificacao.alertaId)),
    )
    const output = ListarNotificacaoDoUsuarioMapper.paraOutput(listaNotificoes, listaAlertas)
    return output
  }
}
