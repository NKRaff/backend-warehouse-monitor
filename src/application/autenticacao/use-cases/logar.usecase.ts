import type { UseCase } from '@/application/usecase.js'
import type { AutenticacaoRepository } from '@/domain/autenticacao/autenticacao.repository.js'
import type { UsuarioRepository } from '@/domain/usuario/usuario.repository.js'
import { compare } from 'bcrypt'
import { sign } from 'jsonwebtoken'
import type { LogarInputDto, LogarOutputDto } from '../dtos/logar.dto.js'

export class LogarUseCase implements UseCase<LogarInputDto, LogarOutputDto> {
  private constructor(
    private readonly usuarioRepo: UsuarioRepository,
    private readonly autenticacaoRepo: AutenticacaoRepository,
  ) {}

  public static create(usuarioRepo: UsuarioRepository, autenticacaoRepo: AutenticacaoRepository) {
    return new LogarUseCase(usuarioRepo, autenticacaoRepo)
  }

  public async execute(input: LogarInputDto): Promise<LogarOutputDto> {
    const usuario = await this.usuarioRepo.findByEmail(input.email)
    if (!usuario) throw new Error('Credenciais invalidas')
    const autenticao = await this.autenticacaoRepo.findByUsuarioId(usuario.id)
    if (!autenticao) throw new Error('O usuario não possui credenciais para autenticação')
    if (!(await compare(input.senha, autenticao.senha))) throw new Error('Credenciais invalidas')
    const token = sign({ sub: usuario.id }, process.env.JWT_SECRET!, { expiresIn: '1h' })
    return { token }
  }
}
