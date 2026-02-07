import type { UseCase } from '@/application/usecase.js'
import type { AmbienteRepository } from '@/domain/ambiente/ambiente.repository.js'
import type {
  ListarAmbientesInputDto,
  ListarAmbientesOutputDto,
} from '../dtos/listar-ambientes.dto.js'
import { ListarAmbientesMapper } from '../mappers/listar-ambientes.mapper.js'

export class ListarAmbientesUseCase
  implements UseCase<ListarAmbientesInputDto, ListarAmbientesOutputDto>
{
  private constructor(private readonly ambienteRepo: AmbienteRepository) {}

  public static create(ambienteRepo: AmbienteRepository) {
    return new ListarAmbientesUseCase(ambienteRepo)
  }
  public async execute(): Promise<ListarAmbientesOutputDto> {
    const ambientes = await this.ambienteRepo.findAll()
    const output = ListarAmbientesMapper.paraOutput(ambientes)
    return output
  }
}
