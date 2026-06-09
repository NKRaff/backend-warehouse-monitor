import type { DispositivoRepository } from '../../../domain/dispositivo/despositivo.repository.js'
import type { UseCase } from '../../usecase.js'
import type {
  ListarDispositivosInputDto,
  ListarDispositivosOutputDto,
} from '../dtos/listar-dispositivos.dto.js'
import { ListarDispositivosMapper } from '../mappers/listar-dispositivos.mappers.js'

export class ListarDispositivosUseCase
  implements UseCase<ListarDispositivosInputDto, ListarDispositivosOutputDto>
{
  private constructor(private readonly dispositivoRepo: DispositivoRepository) {}

  public static create(dispositivoRepo: DispositivoRepository) {
    return new ListarDispositivosUseCase(dispositivoRepo)
  }

  public async execute(): Promise<ListarDispositivosOutputDto> {
    const dispositivos = await this.dispositivoRepo.findAll()
    const output = ListarDispositivosMapper.paraOutput(dispositivos)
    return output
  }
}
