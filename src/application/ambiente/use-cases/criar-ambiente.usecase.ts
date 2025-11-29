import { v7 } from 'uuid'
import type { UseCase } from '@/application/usecase.js'
import { Ambiente } from '@/domain/ambiente/ambiente.entity.js'
import type { AmbienteRepository } from '@/domain/ambiente/ambiente.repository.js'
import type { CriarAmbienteInputDto, CriarAmbienteOutputDto } from '../dtos/criar-ambiente.dto.js'
import { CriarAmbienteMapper } from '../mappers/criar-ambiente.mapper.js'

export class CriarAmbienteUseCase
  implements UseCase<CriarAmbienteInputDto, CriarAmbienteOutputDto>
{
  private constructor(private readonly ambienteRepo: AmbienteRepository) {}

  public static create(ambienteRepo: AmbienteRepository) {
    return new CriarAmbienteUseCase(ambienteRepo)
  }

  public async execute(input: CriarAmbienteInputDto): Promise<CriarAmbienteOutputDto> {
    const ambiente = Ambiente.create(v7(), input.nome, input.tipo, input.descricao)
    await this.ambienteRepo.save(ambiente)
    const output = CriarAmbienteMapper.paraOutput(ambiente)
    return output
  }
}
