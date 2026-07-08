import type { MedicaoRepository } from '../../../domain/medicao/medicao.repository.js'
import type { UseCase } from '../../usecase.js'
import type {
  BuscarUltimaMedicaoInputDto,
  BuscarUltimaMedicaoOutputDto,
} from '../dtos/buscar-ultima-medicao.dto.js'
import { BuscarUltimaMedicaoMapper } from '../mappers/buscar-ultima-medicao.mapper.js'

export class BuscarUltimaMedicaoUseCase
  implements UseCase<BuscarUltimaMedicaoInputDto, BuscarUltimaMedicaoOutputDto>
{
  private constructor(private readonly medicaoRepo: MedicaoRepository) {}

  public static create(medicaoRepo: MedicaoRepository) {
    return new BuscarUltimaMedicaoUseCase(medicaoRepo)
  }

  public async execute(input: BuscarUltimaMedicaoInputDto): Promise<BuscarUltimaMedicaoOutputDto> {
    const ultimaMedicao = await this.medicaoRepo.findLast(input)
    const output = BuscarUltimaMedicaoMapper.paraOutput(ultimaMedicao)
    return output
  }
}
