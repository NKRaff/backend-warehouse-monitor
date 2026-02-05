import type { UseCase } from '@/application/usecase.js'
import type { AtualizarUsuarioOutputDto } from '@/application/usuario/dtos/atualizar-usuario.dto.js'
import {
  type AtualizarUsuarioInputDto,
  AtualizarUsuarioSchema,
} from './atualizar-usuario.schema.js'

export class AtualizarUsuarioController {
  private constructor(
    private readonly useCase: UseCase<AtualizarUsuarioInputDto, AtualizarUsuarioOutputDto>,
  ) {}

  public static create(useCase: UseCase<AtualizarUsuarioInputDto, AtualizarUsuarioOutputDto>) {
    return new AtualizarUsuarioController(useCase)
  }

  public async handle(input: unknown) {
    const dto = AtualizarUsuarioSchema.parse(input)
    return await this.useCase.execute(dto)
  }
}
