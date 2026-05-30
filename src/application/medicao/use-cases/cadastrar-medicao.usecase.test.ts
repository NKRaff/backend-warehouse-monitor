import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AlertaRepository } from '../../../domain/alerta/alerta.repository.js'
import type { AmbienteRepository } from '../../../domain/ambiente/ambiente.repository.js'
import type { DispositivoRepository } from '../../../domain/dispositivo/despositivo.repository.js'
import { Medicao } from '../../../domain/medicao/medicao.entity.js'
import type { MedicaoRepository } from '../../../domain/medicao/medicao.repository.js'
import { Notificacao } from '../../../domain/notificacao/notificacao.entity.js'
import type { NotificacaoRepository } from '../../../domain/notificacao/notificacao.repository.js'
import type { UsuarioRepository } from '../../../domain/usuario/usuario.repository.js'
import type { Mailer } from '../../../infra/smtp/mailer.interface.js'
import type { CadastrarMedicaoInputDto } from '../dtos/cadastrar-medicao.dto.js'
import { CadastrarMedicaoUseCase } from './cadastrar-medicao.usecase.js'

// Mock do Mapper de saída
vi.mock('../mappers/cadastrar-medicao.mapper.js', () => ({
  CadastrarMedicaoMapper: {
    paraOutput: vi.fn().mockImplementation((medicao) => ({ id: medicao.id })),
  },
}))

// Mock utilitário para fixar o UUID v7 se necessário, ou deixamos o uuid original rodar livre.
// Para garantir estabilidade, podemos deixar o uuid gerar valores reais ou mockar se necessário.

describe('CadastrarMedicaoUseCase Unit Tests', () => {
  let medicaoRepoMock: MedicaoRepository
  let dispositivoRepoMock: DispositivoRepository
  let ambienteRepoMock: AmbienteRepository
  let alertaRepoMock: AlertaRepository
  let usuarioRepoMock: UsuarioRepository
  let notificacaoRepoMock: NotificacaoRepository
  let mailerMock: Mailer
  let useCase: CadastrarMedicaoUseCase

  let dispositivoFake: any
  let ambienteFake: any

  const inputValido: CadastrarMedicaoInputDto = {
    dispositivoId: 'esp32-01',
    tipo: 'umidade',
    valor: 75.5,
  }

  beforeEach(() => {
    vi.clearAllMocks()

    dispositivoFake = {
      id: 'esp32-01',
      nome: 'DHT22 Sensor',
      ambienteId: 'ambiente-galpao-1',
    }

    // Mock da entidade de domínio Ambiente e seu método de validação
    ambienteFake = {
      id: 'ambiente-galpao-1',
      nome: 'Almoxarifado Central',
      validarMedicao: vi.fn().mockReturnValue(null), // Por padrão não gera alertas
    }

    // Instanciando mocks de todas as interfaces de repositórios/serviços
    medicaoRepoMock = { save: vi.fn().mockResolvedValue(undefined) } as any
    dispositivoRepoMock = { findById: vi.fn().mockResolvedValue(dispositivoFake) } as any
    ambienteRepoMock = { findById: vi.fn().mockResolvedValue(ambienteFake) } as any
    alertaRepoMock = {
      findAtivoPorAmbienteETipo: vi.fn().mockResolvedValue(null),
      save: vi.fn().mockResolvedValue(undefined),
      updateStatus: vi.fn().mockResolvedValue(undefined),
    } as any
    usuarioRepoMock = { findAll: vi.fn().mockResolvedValue([]) } as any
    notificacaoRepoMock = { save: vi.fn().mockResolvedValue(undefined) } as any
    mailerMock = { sendMail: vi.fn().mockResolvedValue(undefined) } as any

    // Mockando os métodos estáticos de criação de Entidades para evitar acoplamento interno profundo
    vi.spyOn(Medicao, 'create').mockReturnValue({ id: 'mocked-medicao-id' } as any)
    vi.spyOn(Notificacao, 'create').mockReturnValue({ id: 'mocked-notif-id' } as any)

    useCase = CadastrarMedicaoUseCase.create(
      medicaoRepoMock,
      dispositivoRepoMock,
      ambienteRepoMock,
      alertaRepoMock,
      usuarioRepoMock,
      notificacaoRepoMock,
      mailerMock,
    )
  })

  it('deve cadastrar uma medição com sucesso sem gerar novos alertas se o ambiente estiver estável', async () => {
    const resultado = await useCase.execute(inputValido)

    expect(resultado).toStrictEqual({ id: 'mocked-medicao-id' })
    expect(dispositivoRepoMock.findById).toHaveBeenCalledWith('esp32-01')
    expect(ambienteRepoMock.findById).toHaveBeenCalledWith('ambiente-galpao-1')
    expect(Medicao.create).toHaveBeenCalled()
    expect(medicaoRepoMock.save).toHaveBeenCalledTimes(1)
    expect(ambienteFake.validarMedicao).toHaveBeenCalledWith(
      expect.any(String),
      dispositivoFake,
      'umidade',
      75.5,
    )
    expect(alertaRepoMock.save).not.toHaveBeenCalled()
  })

  it('deve disparar um novo alerta, persistir notificações e enviar emails quando o ambiente violar limites', async () => {
    // Arrange
    const alertaGeradoFake = { id: 'alerta-danger-123', encerrar: vi.fn() }
    vi.spyOn(ambienteFake, 'validarMedicao').mockReturnValueOnce(alertaGeradoFake)
    vi.spyOn(alertaRepoMock, 'findAtivoPorAmbienteETipo').mockResolvedValueOnce(null) // Nenhum alerta ativo igual antes

    const usuariosFake = [
      { id: 'user-01', email: 'rafael@dev.com', receberEmail: true },
      { id: 'user-02', email: 'junior@dev.com', receberEmail: false },
    ]
    vi.spyOn(usuarioRepoMock, 'findAll').mockResolvedValueOnce(usuariosFake as any)

    // Act
    await useCase.execute(inputValido)

    // Assert
    expect(alertaRepoMock.save).toHaveBeenCalledWith(alertaGeradoFake)
    expect(usuarioRepoMock.findAll).toHaveBeenCalledTimes(1)

    // Deve criar e salvar notificações para ambos os usuários
    expect(notificacaoRepoMock.save).toHaveBeenCalledTimes(2)

    // Motor de e-mail deve ter enviado apenas para o usuário com a flag ativa
    expect(mailerMock.sendMail).toHaveBeenCalledTimes(1)
    expect(mailerMock.sendMail).toHaveBeenCalledWith({
      to: 'rafael@dev.com',
      subject: 'Teste de email',
      text: 'Email de teste',
    })
  })

  it('deve encerrar o alerta ativo se os níveis retornarem aos parâmetros normais', async () => {
    // Arrange
    vi.spyOn(ambienteFake, 'validarMedicao').mockReturnValueOnce(null) // Normalizou!

    const alertaAtivoFake = {
      id: 'alerta-ativo-antigo',
      ativo: true,
      encerrar: vi.fn().mockImplementation(function (this: any) {
        this.ativo = false
      }),
    }
    vi.spyOn(alertaRepoMock, 'findAtivoPorAmbienteETipo').mockResolvedValueOnce(
      alertaAtivoFake as any,
    )

    // Act
    await useCase.execute(inputValido)

    // Assert
    expect(alertaAtivoFake.encerrar).toHaveBeenCalledTimes(1)
    expect(alertaRepoMock.updateStatus).toHaveBeenCalledWith('alerta-ativo-antigo', false)
    expect(alertaRepoMock.save).not.toHaveBeenCalled()
    expect(usuarioRepoMock.findAll).not.toHaveBeenCalled()
  })

  it('deve lançar erro se o dispositivo informado não for encontrado', async () => {
    vi.spyOn(dispositivoRepoMock, 'findById').mockResolvedValueOnce(null as any)

    await expect(useCase.execute(inputValido)).rejects.toThrow('Dispositivo não encontrado')
    expect(medicaoRepoMock.save).not.toHaveBeenCalled()
  })

  it('deve lançar erro se o dispositivo não possuir um vinculo de ambiente', async () => {
    dispositivoFake.ambienteId = null

    await expect(useCase.execute(inputValido)).rejects.toThrow(
      'Não é possível registrar medição: dispositivo não está associado a um ambiente.',
    )
  })

  it('deve lançar erro se o ambiente associado ao dispositivo não existir mais no banco', async () => {
    vi.spyOn(ambienteRepoMock, 'findById').mockResolvedValueOnce(null as any)

    await expect(useCase.execute(inputValido)).rejects.toThrow(
      'Não é possivel registrar medição: ambiente associado ao dispositivo não encontrado',
    )
  })
})
