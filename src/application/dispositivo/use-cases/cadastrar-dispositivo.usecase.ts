import type { UseCase } from '@/application/usecase.js'
import type { DispositivoRepository } from '@/domain/dispositivo/despositivo.repository.js'
import { Dispositivo } from '@/domain/dispositivo/dispositivo.entity.js'
import type {
  CadastrarDispositivoInputDto,
  CadastrarDispositivoOutputDto,
} from '../dtos/cadastrar-dispositivo.dto.js'
import { CadastrarDispositivoMapper } from '../mappers/cadastrar-dispositivo.mapper.js'

export class CadastrarDispositivoUseCase
  implements UseCase<CadastrarDispositivoInputDto, CadastrarDispositivoOutputDto>
{
  private constructor(private readonly dispositivoRepo: DispositivoRepository) {}

  public static create(dispositivoRepo: DispositivoRepository) {
    return new CadastrarDispositivoUseCase(dispositivoRepo)
  }

  public async execute(input: CadastrarDispositivoInputDto) {
    const dispositivo = Dispositivo.create(input.id, input.nome, input.ambienteId)
    await this.dispositivoRepo.save(dispositivo)
    const output = CadastrarDispositivoMapper.paraOutput(dispositivo)
    return output
  }
}
