import type { RemoverAmbienteOutputDto } from '@/application/ambiente/dtos/remover-ambiente.dto.js'
import type { UseCase } from '@/application/usecase.js'
import { type RemoverAmbienteInputDto, RemoverAmbienteSchema } from './remover-ambiente.schema.js'

export class RemoverAmbienteController {
  private constructor(
    private readonly useCase: UseCase<RemoverAmbienteInputDto, RemoverAmbienteOutputDto>,
  ) {}

  public static create(useCase: UseCase<RemoverAmbienteInputDto, RemoverAmbienteOutputDto>) {
    return new RemoverAmbienteController(useCase)
  }

  public async handle(input: unknown) {
    const dto = RemoverAmbienteSchema.parse(input)
    this.useCase.execute(dto)
  }
}
