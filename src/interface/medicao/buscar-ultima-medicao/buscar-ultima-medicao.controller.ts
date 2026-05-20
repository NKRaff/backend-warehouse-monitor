import type {
  BuscarUltimaMedicaoInputDto,
  BuscarUltimaMedicaoOutputDto,
} from '../../../application/medicao/dtos/buscar-ultima-medicao.dto.js'
import type { UseCase } from '../../../application/usecase.js'
import { BuscarUltimaMedicaoSchema } from './buscar-ultima-medicao.schema.js'

export class BuscarUltimaMedicaoController {
  private constructor(
    private readonly useCase: UseCase<BuscarUltimaMedicaoInputDto, BuscarUltimaMedicaoOutputDto>,
  ) {}

  public static create(
    useCase: UseCase<BuscarUltimaMedicaoInputDto, BuscarUltimaMedicaoOutputDto>,
  ) {
    return new BuscarUltimaMedicaoController(useCase)
  }

  public async handle(input: any) {
    const dto = BuscarUltimaMedicaoSchema.parse(input)
    return await this.useCase.execute(dto)
  }
}
