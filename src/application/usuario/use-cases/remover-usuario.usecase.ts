import type { UseCase } from '@/application/usecase.js'
import type { AutenticacaoRepository } from '@/domain/autenticacao/autenticacao.repository.js'
import type { UsuarioRepository } from '@/domain/usuario/usuario.repository.js'
import type {
  RemoverUsuarioInputDto,
  RemoverUsuarioOutputDto,
} from '../dtos/remover-usuario.dto.js'

export class RemoverUsuarioUseCase
  implements UseCase<RemoverUsuarioInputDto, RemoverUsuarioOutputDto>
{
  private constructor(
    private readonly usuarioRepo: UsuarioRepository,
    private readonly autenticacaoRepo: AutenticacaoRepository,
  ) {}

  public static create(usuarioRepo: UsuarioRepository, autenticacaoRepo: AutenticacaoRepository) {
    return new RemoverUsuarioUseCase(usuarioRepo, autenticacaoRepo)
  }

  public async execute(input: RemoverUsuarioInputDto): Promise<void> {
    const usuario = await this.usuarioRepo.findById(input.id)
    if (!usuario) throw new Error('Não é possivel remover usuario: esse usuario não existe')
    const autenticacao = await this.autenticacaoRepo.findByUsuarioId(input.id)
    if (!autenticacao)
      throw new Error('Não é possivel remover usuario: o usuario não possui credenciais')
    await this.usuarioRepo.delete(input.id)
    await this.autenticacaoRepo.delete(autenticacao.id)
  }
}
