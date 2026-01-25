import type { LogarInputDto, LogarOutputDto } from '@/application/autenticacao/dtos/logar.dto.js'
import type { UseCase } from '@/application/usecase.js'
import { LoginSchema } from './logar.schema.js'

export class LoginController {
  private constructor(private readonly useCase: UseCase<LogarInputDto, LogarOutputDto>) {}

  public static create(useCase: UseCase<LogarInputDto, LogarOutputDto>) {
    return new LoginController(useCase)
  }

  public async handle(input: unknown) {
    const dto = LoginSchema.parse(input)
    return await this.useCase.execute(dto)
  }
}
