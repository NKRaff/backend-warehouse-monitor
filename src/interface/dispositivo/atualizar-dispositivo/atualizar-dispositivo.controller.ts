import type {
  AtualizarDispositivoInputDto,
  AtualizarDispositivoOutputDto,
} from '@/application/dispositivo/dtos/atualizar-dispositivo.dto.js'
import type { UseCase } from '@/application/usecase.js'
import { AtualizarDispositivoSchema } from './atualizar-dispositivo.schema.js'

export class AtualizarDispositivoController {
  private constructor(
    private readonly useCase: UseCase<AtualizarDispositivoInputDto, AtualizarDispositivoOutputDto>,
  ) {}

  public static create(
    useCase: UseCase<AtualizarDispositivoInputDto, AtualizarDispositivoOutputDto>,
  ) {
    return new AtualizarDispositivoController(useCase)
  }

  public async handle(input: unknown) {
    const dto = AtualizarDispositivoSchema.parse(input)
    return await this.useCase.execute(dto)
  }
}
