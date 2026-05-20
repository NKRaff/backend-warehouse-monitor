import type { UseCase } from '../../../application/usecase.js'
import type {
  RemoverUsuarioInputDto,
  RemoverUsuarioOutputDto,
} from '../../../application/usuario/dtos/remover-usuario.dto.js'
import { RemoverUsuarioSchema } from './remover-usuario.schema.js'

export class RemoverUsuarioController {
  private constructor(
    private readonly useCase: UseCase<RemoverUsuarioInputDto, RemoverUsuarioOutputDto>,
  ) {}

  public static create(useCase: UseCase<RemoverUsuarioInputDto, RemoverUsuarioOutputDto>) {
    return new RemoverUsuarioController(useCase)
  }

  public async handle(input: unknown) {
    const dto = RemoverUsuarioSchema.parse(input)
    return await this.useCase.execute(dto)
  }
}
