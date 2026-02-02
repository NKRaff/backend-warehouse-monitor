import type { UseCase } from '@/application/usecase.js'
import type { AlertaRepository } from '@/domain/alerta/alerta.repository.js'
import type { AmbienteRepository } from '@/domain/ambiente/ambiente.repository.js'
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
    private readonly ambienteRepo: AmbienteRepository,
    private readonly alertaRepo: AlertaRepository,
  ) {}

  public static create(
    medicaoRepo: MedicaoRepository,
    dispositivoRepo: DispositivoRepository,
    ambienteRepo: AmbienteRepository,
    alertaRepo: AlertaRepository,
  ) {
    return new CadastrarMedicaoUseCase(medicaoRepo, dispositivoRepo, ambienteRepo, alertaRepo)
  }

  public async execute(input: CadastrarMedicaoInputDto): Promise<CadastrarMedicaoOutputDto> {
    const dispositivo = await this.dispositivoRepo.findById(input.dispositivoId)

    if (!dispositivo) throw new Error('Dispositivo não encontrado')

    if (!dispositivo.ambienteId)
      throw new Error(
        'Não é possível registrar medição: dispositivo não está associado a um ambiente.',
      )

    const ambiente = await this.ambienteRepo.findById(dispositivo.ambienteId)

    if (!ambiente)
      throw new Error(
        'Não é possivel registrar medição: ambiente associado ao dispositivo não encontrado',
      )

    const medicao = Medicao.create(
      v7(),
      input.dispositivoId,
      dispositivo.ambienteId,
      input.tipo,
      input.valor,
    )
    await this.medicaoRepo.save(medicao)

    const idAlerta = v7()
    const alertaGerado = ambiente.validarMedicao(idAlerta, dispositivo, input.tipo, input.valor)
    const alertaAtivo = await this.alertaRepo.findAtivoPorAmbienteETipo(ambiente.id, input.tipo)

    if (alertaGerado && !alertaAtivo) {
      await this.alertaRepo.save(alertaGerado)
      console.log('gerou alerta')
    }
    if (!alertaGerado && alertaAtivo) {
      alertaAtivo.encerrar()
      await this.alertaRepo.updateStatus(alertaAtivo.id, alertaAtivo.ativo)
    }

    const output = CadastrarMedicaoMapper.paraOutput(medicao)
    return output
  }
}
