import type { UseCase } from '@/application/usecase.js'
import type { DispositivoRepository } from '@/domain/dispositivo/despositivo.repository.js'
import { Medicao } from '@/domain/medicao/medicao.entity.js'
import type { MedicaoRepository } from '@/domain/medicao/medicao.repository.js'
import { v7 } from 'uuid'
import type {
  CadastrarMedicaoInputDto,
  CadastrarMedicaoOutputDto,
} from '../dtos/cadastrar-medicao.dto.js'
import { CadastrarMedicaoMapper } from '../mappers/cadastrar-medicao.mapper.js'

export class CadastrarMedicaoUseCase
  implements UseCase<CadastrarMedicaoInputDto, CadastrarMedicaoOutputDto>
{
  private constructor(
    private readonly medicaoRepo: MedicaoRepository,
    private readonly dispositivoRepo: DispositivoRepository,
  ) {}

  public static create(medicaoRepo: MedicaoRepository, dispositivoRepo: DispositivoRepository) {
    return new CadastrarMedicaoUseCase(medicaoRepo, dispositivoRepo)
  }

  public async execute(input: CadastrarMedicaoInputDto): Promise<CadastrarMedicaoOutputDto> {
    const dispositivo = await this.dispositivoRepo.findById(input.dispositivoId)
    if (!dispositivo.ambienteId)
      throw new Error(
        'Não é possível registrar medição: dispositivo não está associado a um ambiente.',
      )
    const medicao = Medicao.create(
      v7(),
      input.dispositivoId,
      dispositivo.ambienteId,
      input.tipo,
      input.valor,
    )
    await this.medicaoRepo.save(medicao)
    const output = CadastrarMedicaoMapper.paraOutput(medicao)
    return output
  }
}
