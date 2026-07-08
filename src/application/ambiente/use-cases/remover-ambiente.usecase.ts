import type { AmbienteRepository } from '../../../domain/ambiente/ambiente.repository.js'
import type { DispositivoRepository } from '../../../domain/dispositivo/despositivo.repository.js'
import type { UseCase } from '../../usecase.js'
import type {
  RemoverAmbienteInputDto,
  RemoverAmbienteOutputDto,
} from '../dtos/remover-ambiente.dto.js'

export class RemoverAmbienteUseCase
  implements UseCase<RemoverAmbienteInputDto, RemoverAmbienteOutputDto>
{
  private constructor(
    private readonly ambienteRepo: AmbienteRepository,
    private readonly dispositivoRepo: DispositivoRepository,
  ) {}

  public static create(ambienteRepo: AmbienteRepository, dispositivoRepo: DispositivoRepository) {
    return new RemoverAmbienteUseCase(ambienteRepo, dispositivoRepo)
  }

  public async execute(input: RemoverAmbienteInputDto) {
    await this.ambienteRepo.delete(input.id)
    const dispositivos = await this.dispositivoRepo.findByAmbienteId(input.id)
    if (dispositivos) {
      dispositivos.map((dis) => dis.removerAmbiente())
    }
  }
}
