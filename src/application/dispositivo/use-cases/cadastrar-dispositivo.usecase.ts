import type { UseCase } from '@/application/usecase.js'
import type { DispositivoRepository } from '@/domain/dispositivo/despositivo.repository.js'
import { Dispositivo } from '@/domain/dispositivo/dispositivo.entity.js'
import type { SubscriberTopic } from '@/domain/medicao/subscriber.repository.js'
import type {
  CadastrarDispositivoInputDto,
  CadastrarDispositivoOutputDto,
} from '../dtos/cadastrar-dispositivo.dto.js'
import { CadastrarDispositivoMapper } from '../mappers/cadastrar-dispositivo.mapper.js'

export class CadastrarDispositivoUseCase
  implements UseCase<CadastrarDispositivoInputDto, CadastrarDispositivoOutputDto>
{
  private constructor(
    private readonly dispositivoRepo: DispositivoRepository,
    private readonly subscriber: SubscriberTopic,
  ) {}

  public static create(dispositivoRepo: DispositivoRepository, subscriber: SubscriberTopic) {
    return new CadastrarDispositivoUseCase(dispositivoRepo, subscriber)
  }

  public async execute(input: CadastrarDispositivoInputDto) {
    const dispositivo = Dispositivo.create(input.id, input.nome, input.ambienteId)
    await this.dispositivoRepo.save(dispositivo)
    await this.subscriber.dispositivoSubscribe(input.id)
    const output = CadastrarDispositivoMapper.paraOutput(dispositivo)
    return output
  }
}
