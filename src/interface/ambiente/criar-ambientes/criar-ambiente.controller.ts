import type { CriarAmbienteOutputDto } from '../../../application/ambiente/dtos/criar-ambiente.dto.js'
import type { UseCase } from '../../../application/usecase.js'
import { type CriarAmbienteInputDto, CriarAmbienteSchema } from './criar-ambiente.schema.js'

export class CriarAmbienteController {
  private constructor(
    private readonly useCase: UseCase<CriarAmbienteInputDto, CriarAmbienteOutputDto>,
  ) {}

  public static create(useCase: UseCase<CriarAmbienteInputDto, CriarAmbienteOutputDto>) {
    return new CriarAmbienteController(useCase)
  }

  public async handle(input: unknown) {
    const dto = CriarAmbienteSchema.parse(input)
    return await this.useCase.execute(dto)
  }
}
