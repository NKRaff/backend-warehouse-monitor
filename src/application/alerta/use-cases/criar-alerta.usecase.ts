import type { UseCase } from '@/application/usecase.js'
import { Alerta } from '@/domain/alerta/alerta.entity.js'
import type { AlertaRepository } from '@/domain/alerta/alerta.repository.js'
import { v7 } from 'uuid'
import type { CriarAlertaInputDto, CriarAlertaOutputDto } from '../dtos/criar-alerta.dto.js'

export class CriarAlertaUseCase implements UseCase<CriarAlertaInputDto, CriarAlertaOutputDto> {
  private constructor(private readonly alertaRepo: AlertaRepository) {}

  public static create(alertaRepo: AlertaRepository) {
    return new CriarAlertaUseCase(alertaRepo)
  }

  public async execute(input: CriarAlertaInputDto): Promise<void> {
    const alerta = Alerta.create(
      v7(),
      input.dispositivoId,
      input.ambienteId,
      input.tipo,
      input.nivel,
      input.mensagem,
      true,
      input.sensorTipo,
      input.valorAtual,
      input.limiteMin,
      input.limiteMax,
    )
    await this.alertaRepo.save(alerta)
  }
}
