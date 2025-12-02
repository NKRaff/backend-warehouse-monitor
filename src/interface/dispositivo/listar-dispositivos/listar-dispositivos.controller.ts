import type {
  ListarDispositivosInputDto,
  ListarDispositivosOutputDto,
} from '@/application/dispositivo/dtos/listar-dispositivos.dto.js'
import type { UseCase } from '@/application/usecase.js'

export class ListarDispositivosController {
  private constructor(
    private readonly useCase: UseCase<ListarDispositivosInputDto, ListarDispositivosOutputDto>,
  ) {}

  public static create(useCase: UseCase<ListarDispositivosInputDto, ListarDispositivosOutputDto>) {
    return new ListarDispositivosController(useCase)
  }

  public async handle(): Promise<ListarDispositivosOutputDto> {
    return await this.useCase.execute()
  }
}
