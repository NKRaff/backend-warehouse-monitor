import type { UseCase } from '@/application/usecase.js'
import type { DispositivoRepository } from '@/domain/dispositivo/despositivo.repository.js'
import type {
  RemoverDispositivoInputDto,
  RemoverDispositivoOutputDto,
} from '../dtos/remover-dispositivo.dto.js'

export class RemoverDispositivoUseCase
  implements UseCase<RemoverDispositivoInputDto, RemoverDispositivoOutputDto>
{
  private constructor(private readonly dispositivoRepo: DispositivoRepository) {}

  public static create(dispositivoRepo: DispositivoRepository) {
    return new RemoverDispositivoUseCase(dispositivoRepo)
  }

  public async execute(input: RemoverDispositivoInputDto): Promise<void> {
    const dispositivo = await this.dispositivoRepo.findById(input.id)
    if (!dispositivo)
      throw new Error(
        'Não é possivel remover dispositivo: não existe nunhum dispositivo com esse id',
      )
    await this.dispositivoRepo.delete(input.id)
  }
}
