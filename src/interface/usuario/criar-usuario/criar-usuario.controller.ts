import type { UseCase } from '@/application/usecase.js'
import type { CriarUsuarioOutputDto } from '@/application/usuario/dtos/criar-usuario.dto.js'
import { type CriarUsuarioInputDto, CriarUsuarioSchema } from './criar-usuario.schema.js'

export class CriarUsuarioController {
  private constructor(
    private readonly useCase: UseCase<CriarUsuarioInputDto, CriarUsuarioOutputDto>,
  ) {}

  public static create(useCase: UseCase<CriarUsuarioInputDto, CriarUsuarioOutputDto>) {
    return new CriarUsuarioController(useCase)
  }

  public async handle(input: unknown) {
    const dto = CriarUsuarioSchema.parse(input)
    return await this.useCase.execute(dto)
  }
}
