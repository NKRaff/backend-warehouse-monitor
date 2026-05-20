import type {
  ListarNotificaoDoUsuarioInputDto,
  ListarNotificaoDoUsuarioOutputDto,
} from '../../../application/notificacao/dtos/listar-notificacao-do-usuario.dto.js'
import type { UseCase } from '../../../application/usecase.js'
import { ListarNotificacaoDoUsuarioSchema } from './listar-notificao-do-usuario.schema.js'

export class ListarNotificacaoDoUsuarioController {
  private constructor(
    private readonly useCase: UseCase<
      ListarNotificaoDoUsuarioInputDto,
      ListarNotificaoDoUsuarioOutputDto
    >,
  ) {}

  public static create(
    useCase: UseCase<ListarNotificaoDoUsuarioInputDto, ListarNotificaoDoUsuarioOutputDto>,
  ) {
    return new ListarNotificacaoDoUsuarioController(useCase)
  }

  public async handle(input: unknown) {
    const dto = ListarNotificacaoDoUsuarioSchema.parse(input)
    return await this.useCase.execute(dto)
  }
}
