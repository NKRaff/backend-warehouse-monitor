import type {
  CadastrarMedicaoInputDto,
  CadastrarMedicaoOutputDto,
} from '../../../application/medicao/dtos/cadastrar-medicao.dto.js'
import type { UseCase } from '../../../application/usecase.js'
import { CadastrarMedicaoSchema } from './cadastrar-medicao.schema.js'

export class CadastrarMedicaoController {
  private constructor(
    private readonly useCase: UseCase<CadastrarMedicaoInputDto, CadastrarMedicaoOutputDto>,
  ) {}

  public static create(useCase: UseCase<CadastrarMedicaoInputDto, CadastrarMedicaoOutputDto>) {
    return new CadastrarMedicaoController(useCase)
  }

  public async handle(message: { topic: string; payload: Buffer }) {
    const parts = message.topic.split('/')
    const dispositivoId = parts[0]
    const tipo = parts[1]
    const valor = message.payload.toString()
    const dto = CadastrarMedicaoSchema.parse({ dispositivoId, tipo, valor })
    return await this.useCase.execute(dto)
  }
}
