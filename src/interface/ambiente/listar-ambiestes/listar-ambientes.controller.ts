import type {
  ListarAmbientesInputDto,
  ListarAmbientesOutputDto,
} from '@/application/ambiente/dtos/listar-ambientes.dto.js'
import type { UseCase } from '@/application/usecase.js'

export class ListarAmbientesController {
  private constructor(
    private readonly useCase: UseCase<ListarAmbientesInputDto, ListarAmbientesOutputDto>,
  ) {}

  public static create(useCase: UseCase<ListarAmbientesInputDto, ListarAmbientesOutputDto>) {
    return new ListarAmbientesController(useCase)
  }

  public async handle() {
    return await this.useCase.execute()
  }
}
