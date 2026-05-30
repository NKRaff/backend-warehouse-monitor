import type {
  BuscarMedicoesInputDto,
  BuscarMedicoesOutputDto,
} from '../../../application/medicao/dtos/buscar-medicoes.dto.js'
import type { UseCase } from '../../../application/usecase.js'
import { BuscarMedicoesSchema } from './buscar-medicoes.schema.js'

export class BuscarMedicoesController {
  private constructor(
    private readonly useCase: UseCase<BuscarMedicoesInputDto, BuscarMedicoesOutputDto>,
  ) {}

  public static create(useCase: UseCase<BuscarMedicoesInputDto, BuscarMedicoesOutputDto>) {
    return new BuscarMedicoesController(useCase)
  }

  public async handle(input: any) {
    const dto = BuscarMedicoesSchema.parse(input)
    return await this.useCase.execute(dto)
  }
}
