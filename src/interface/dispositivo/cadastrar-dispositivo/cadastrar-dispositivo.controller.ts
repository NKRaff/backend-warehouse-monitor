import type { CadastrarDispositivoOutputDto } from '@/application/dispositivo/dtos/cadastrar-dispositivo.dto.js'
import type { UseCase } from '@/application/usecase.js'
import {
  type CadastrarDispositivoInputDto,
  CadastrarDispositivoSchema,
} from './cadastrar-dispositivo.schema.js'

export class CadastrarDispositivoController {
  private constructor(
    private readonly useCase: UseCase<CadastrarDispositivoInputDto, CadastrarDispositivoOutputDto>,
  ) {}

  public static create(
    useCase: UseCase<CadastrarDispositivoInputDto, CadastrarDispositivoOutputDto>,
  ) {
    return new CadastrarDispositivoController(useCase)
  }

  public async handle(input: unknown) {
    const dto = CadastrarDispositivoSchema.parse(input)
    return await this.useCase.execute(dto)
  }
}
