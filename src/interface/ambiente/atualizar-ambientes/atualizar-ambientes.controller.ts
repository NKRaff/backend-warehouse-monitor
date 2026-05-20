import type { AtualizarAmbienteOutputDto } from '../../../application/ambiente/dtos/atualizar-ambiente.dto.js'
import type { UseCase } from '../../../application/usecase.js'
import {
  type AtualizarAmbienteInputDto,
  AtualizarAmbienteSchema,
} from './atualizar-ambiente.schema.js'

export class AtualizarAmbienteController {
  private constructor(
    private readonly useCase: UseCase<AtualizarAmbienteInputDto, AtualizarAmbienteOutputDto>,
  ) {}

  public static create(useCase: UseCase<AtualizarAmbienteInputDto, AtualizarAmbienteOutputDto>) {
    return new AtualizarAmbienteController(useCase)
  }

  public async handle(input: unknown) {
    const dto = AtualizarAmbienteSchema.parse(input)
    return await this.useCase.execute(dto)
  }
}
