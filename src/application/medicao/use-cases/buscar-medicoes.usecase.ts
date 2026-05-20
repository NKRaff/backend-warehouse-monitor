import type { MedicaoRepository } from '../../../domain/medicao/medicao.repository.js'
import type { UseCase } from '../../usecase.js'
import type {
  BuscarMedicoesInputDto,
  BuscarMedicoesOutputDto,
} from '../dtos/buscar-medicoes.dto.js'
import { BuscarMedicoesMapper } from '../mappers/buscar-medicoes.mapper.js'

export class BuscarMedicaoUseCase
  implements UseCase<BuscarMedicoesInputDto, BuscarMedicoesOutputDto>
{
  private constructor(private readonly medicaoRepo: MedicaoRepository) {}

  public static create(medicaoRepo: MedicaoRepository) {
    return new BuscarMedicaoUseCase(medicaoRepo)
  }

  async execute(input: BuscarMedicoesInputDto): Promise<BuscarMedicoesOutputDto> {
    const listaMedicoes = await this.medicaoRepo.search(input)
    const output = BuscarMedicoesMapper.paraOutput(listaMedicoes)
    return output
  }
}
