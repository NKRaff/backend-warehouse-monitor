import type { UseCase } from '@/application/usecase.js'
import type {
  RecebimentoEmailInputDto,
  RecebimentoEmailOutputDto,
} from '@/application/usuario/dtos/recebimento-email.dto.js'
import { RecebimentoEmailSchema } from './recebimento-email.schema.js'

export class AtivarRecebimentoEmailController {
  private constructor(
    private readonly useCase: UseCase<RecebimentoEmailInputDto, RecebimentoEmailOutputDto>,
  ) {}

  public static create(useCase: UseCase<RecebimentoEmailInputDto, RecebimentoEmailOutputDto>) {
    return new AtivarRecebimentoEmailController(useCase)
  }

  public async handle(input: unknown) {
    const dto = RecebimentoEmailSchema.parse(input)
    return await this.useCase.execute(dto)
  }
}
