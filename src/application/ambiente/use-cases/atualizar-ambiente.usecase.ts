import type { UseCase } from '@/application/usecase.js'
import type { AmbienteRepository } from '@/domain/ambiente/ambiente.repository.js'
import type {
  AtualizarAmbienteInputDto,
  AtualizarAmbienteOutputDto,
} from '../dtos/atualizar-ambiente.dto.js'
import { AtualizarAmbienteMapper } from '../mappers/atualizar-ambiente.dto.js'

export class AtualizarAmbienteUseCase
  implements UseCase<AtualizarAmbienteInputDto, AtualizarAmbienteOutputDto>
{
  private constructor(private readonly ambienteRepo: AmbienteRepository) {}

  public static create(ambienteRepo: AmbienteRepository) {
    return new AtualizarAmbienteUseCase(ambienteRepo)
  }

  public async execute(input: AtualizarAmbienteInputDto): Promise<AtualizarAmbienteOutputDto> {
    if (!input.id && !input.descricao)
      throw new Error('Não é possivel atualizar ambiente: não existe nenhum dado a ser alterado')
    const ambiente = await this.ambienteRepo.findById(input.id)
    if (!ambiente)
      throw new Error('Não é possível atualizar ambiente: não existe ambiente associado a esse id.')
    ambiente.update(input.nome, input.descricao)
    await this.ambienteRepo.update(ambiente)
    const output = AtualizarAmbienteMapper.paraOutput(ambiente)
    return output
  }
}
