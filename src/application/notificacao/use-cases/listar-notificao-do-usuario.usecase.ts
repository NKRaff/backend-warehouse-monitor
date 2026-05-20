import type { AlertaRepository } from '../../../domain/alerta/alerta.repository.js'
import type { NotificacaoRepository } from '../../../domain/notificacao/notificacao.repository.js'
import type { UseCase } from '../../usecase.js'
import type {
  ListarNotificaoDoUsuarioInputDto,
  ListarNotificaoDoUsuarioOutputDto,
} from '../dtos/listar-notificacao-do-usuario.dto.js'
import { ListarNotificacaoDoUsuarioMapper } from '../mappers/listar-notificao-do-usuario.mapper.js'

export class ListarNotificaoDoUsuarioUseCase
  implements UseCase<ListarNotificaoDoUsuarioInputDto, ListarNotificaoDoUsuarioOutputDto>
{
  private constructor(
    private readonly alertaRepo: AlertaRepository,
    private readonly notificacaoRepo: NotificacaoRepository,
  ) {}

  public static create(alertaRepo: AlertaRepository, notificacaoRepo: NotificacaoRepository) {
    return new ListarNotificaoDoUsuarioUseCase(alertaRepo, notificacaoRepo)
  }

  public async execute(
    input: ListarNotificaoDoUsuarioInputDto,
  ): Promise<ListarNotificaoDoUsuarioOutputDto> {
    const listaNotificoes = await this.notificacaoRepo.findByUsuario(input.usuarioId)
    const listaAlertas = await Promise.all(
      listaNotificoes.map((notificacao) => this.alertaRepo.findById(notificacao.alertaId)),
    )
    const output = ListarNotificacaoDoUsuarioMapper.paraOutput(listaNotificoes, listaAlertas)
    return output
  }
}
