import type {
  RemoverDispositivoInputDto,
  RemoverDispositivoOutputDto,
} from '../../../application/dispositivo/dtos/remover-dispositivo.dto.js'
import type { UseCase } from '../../../application/usecase.js'
import { RemoverDispositivoSchema } from './remover-dispositivo.schema.js'

export class RemoverDispositivoController {
  private constructor(
    private readonly useCase: UseCase<RemoverDispositivoInputDto, RemoverDispositivoOutputDto>,
  ) {}

  public static create(useCase: UseCase<RemoverDispositivoInputDto, RemoverDispositivoOutputDto>) {
    return new RemoverDispositivoController(useCase)
  }

  public async handle(input: unknown) {
    const dto = RemoverDispositivoSchema.parse(input)
    return await this.useCase.execute(dto)
  }
}
