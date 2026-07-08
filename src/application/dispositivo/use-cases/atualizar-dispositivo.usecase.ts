import type { DispositivoRepository } from '../../../domain/dispositivo/despositivo.repository.js'
import type { UseCase } from '../../usecase.js'
import type {
  AtualizarDispositivoInputDto,
  AtualizarDispositivoOutputDto,
} from '../dtos/atualizar-dispositivo.dto.js'
import { AtualizarDispositivoMapper } from '../mappers/atualizar-dispositivo.mapper.js'

export class AtualizarDispositivoUseCase
  implements UseCase<AtualizarDispositivoInputDto, AtualizarDispositivoOutputDto>
{
  private constructor(private readonly dispositivoRepo: DispositivoRepository) {}

  public static create(dispositivoRepo: DispositivoRepository) {
    return new AtualizarDispositivoUseCase(dispositivoRepo)
  }

  public async execute(
    input: AtualizarDispositivoInputDto,
  ): Promise<AtualizarDispositivoOutputDto> {
    const dispositivo = await this.dispositivoRepo.findById(input.id)
    if (!dispositivo)
      throw new Error(
        'Não é possível atualizar dispositivo: não existe dispositivo associado a esse id.',
      )
    dispositivo.update(input.nome, input.ambienteId)
    await this.dispositivoRepo.update(dispositivo)
    const output = AtualizarDispositivoMapper.paraOutput(dispositivo)
    return output
  }
}
