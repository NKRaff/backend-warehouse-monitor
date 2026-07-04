import type { UseCase } from '../../../application/usecase.js'
import type {
  BuscarUsuarioInputDto,
  BuscarUsuarioOutputDto,
} from '../../../application/usuario/dtos/buscar-usuario.dto.js'
import { BuscarUsuarioSchema } from './buscar-usuario.schema.js'

export class BuscarUsuarioController {
  private constructor(
    private readonly useCase: UseCase<BuscarUsuarioInputDto, BuscarUsuarioOutputDto>,
  ) {}

  public static create(useCase: UseCase<BuscarUsuarioInputDto, BuscarUsuarioOutputDto>) {
    return new BuscarUsuarioController(useCase)
  }

  public async handle(input: unknown) {
    const dto = BuscarUsuarioSchema.parse(input)
    return await this.useCase.execute(dto)
  }
}
