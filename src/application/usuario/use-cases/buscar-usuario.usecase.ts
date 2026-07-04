import type { UsuarioRepository } from '../../../domain/usuario/usuario.repository.js'
import type { UseCase } from '../../usecase.js'
import type { BuscarUsuarioInputDto, BuscarUsuarioOutputDto } from '../dtos/buscar-usuario.dto.js'
import { BuscarUsuarioMapper } from '../mappers/buscar-usuario.mapper.js'

export class BuscarUsuarioUseCase
  implements UseCase<BuscarUsuarioInputDto, BuscarUsuarioOutputDto>
{
  private constructor(private readonly usuarioRepo: UsuarioRepository) {}

  public static create(usuarioRepo: UsuarioRepository) {
    return new BuscarUsuarioUseCase(usuarioRepo)
  }

  public async execute(input: BuscarUsuarioInputDto): Promise<BuscarUsuarioOutputDto> {
    const usuario = await this.usuarioRepo.findById(input.id)
    if (!usuario) throw new Error('Usuario não encontrado')

    const output = BuscarUsuarioMapper.paraOutput(usuario)
    return output
  }
}
