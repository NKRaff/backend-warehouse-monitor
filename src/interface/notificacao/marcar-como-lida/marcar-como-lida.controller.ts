import type {
  MarcarComoLidaInputDto,
  MarcarComoLidaOutputDto,
} from '@/application/notificacao/dtos/marcar-como-lida.dto.js'
import type { UseCase } from '@/application/usecase.js'
import { MarcarComoLidaSchema } from './marcar-como-lida.schema.js'

export class MarcarComoLidaController {
  private constructor(
    private readonly useCase: UseCase<MarcarComoLidaInputDto, MarcarComoLidaOutputDto>,
  ) {}

  public static create(useCase: UseCase<MarcarComoLidaInputDto, MarcarComoLidaOutputDto>) {
    return new MarcarComoLidaController(useCase)
  }

  public async handle(input: unknown) {
    const dto = MarcarComoLidaSchema.parse(input)
    return await this.useCase.execute(dto)
  }
}
