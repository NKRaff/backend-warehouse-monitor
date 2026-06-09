import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Alerta } from '../alerta/alerta.entity.js'
import type { Dispositivo } from '../dispositivo/dispositivo.entity.js'
import { Ambiente } from './ambiente.entity.js'

vi.mock('../alerta/alerta.entity.js', () => {
  return {
    Alerta: {
      create: vi.fn().mockImplementation((...args) => ({ mock: 'alerta_instancia', args })),
    },
  }
})

describe('Ambiente', () => {
  let ambiente: Ambiente
  let mockDispositivo: Dispositivo

  beforeEach(() => {
    vi.clearAllMocks()

    ambiente = Ambiente.create('1', 'geladeira', 'frio', 5, 15, 50, 80)

    mockDispositivo = { id: 'disp-1' } as Dispositivo
  })

  describe('Criação e Atributos', () => {
    it('deve ser criado quando valores forem validos', () => {
      const ambienteSemDesc = Ambiente.create('1', 'geladeira', 'frio', 5, 15, 50, 80)
      const ambienteComDesc = Ambiente.create('1', 'geladeira', 'frio', 5, 15, 50, 80, 'freezer 1')

      expect(ambienteSemDesc).toBeDefined()
      expect(ambienteComDesc).toBeDefined()
    })

    it('deve retornar atributos corretos do ambiente', () => {
      expect(ambiente.id).toBe('1')
      expect(ambiente.nome).toBe('geladeira')
      expect(ambiente.tipo).toBe('frio')
      expect(ambiente.descricao).toBe('Sem descrição')
      expect(ambiente.temperaturaMinima).toBe(5)
      expect(ambiente.temperaturaMaxima).toBe(15)
      expect(ambiente.umidadeMinima).toBe(50)
      expect(ambiente.umidadeMaxima).toBe(80)
    })
  })

  describe('Método update', () => {
    it('deve atualizar apenas nome e descrição com sucesso', () => {
      ambiente.update('Novo Nome', 'Nova Descrição')

      expect(ambiente.nome).toBe('Novo Nome')
      expect(ambiente.descricao).toBe('Nova Descrição')
      expect(ambiente.temperaturaMinima).toBe(5)
      expect(ambiente.umidadeMinima).toBe(50)
    })

    it('deve atualizar os limites de temperatura e umidade com valores válidos', () => {
      ambiente.update(undefined, undefined, 2, 18, 40, 90)

      expect(ambiente.temperaturaMinima).toBe(2)
      expect(ambiente.temperaturaMaxima).toBe(18)
      expect(ambiente.umidadeMinima).toBe(40)
      expect(ambiente.umidadeMaxima).toBe(90)
    })

    it('deve lançar erro se a temperatura mínima for maior ou igual à máxima', () => {
      expect(() => ambiente.update(undefined, undefined, 20, 15)).toThrow(
        'Temperatura mínima não pode ser maior ou igual à temperatura máxima',
      )
      expect(() => ambiente.update(undefined, undefined, 15, 15)).toThrow(
        'Temperatura mínima não pode ser maior ou igual à temperatura máxima',
      )
    })

    it('deve lançar erro se a umidade mínima for maior ou igual à máxima', () => {
      expect(() => ambiente.update(undefined, undefined, undefined, undefined, 85, 80)).toThrow(
        'Umidade mínima não pode ser maior ou igual à umidade máxima',
      )
      expect(() => ambiente.update(undefined, undefined, undefined, undefined, 80, 80)).toThrow(
        'Umidade mínima não pode ser maior ou igual à umidade máxima',
      )
    })
  })

  describe('Método validarMedicao', () => {
    describe('Validação de Temperatura', () => {
      it('deve retornar null se a temperatura estiver estritamente dentro do limite', () => {
        const alerta = ambiente.validarMedicao('alerta-id', mockDispositivo, 'temperatura', 10)
        expect(alerta).toBeNull()
      })

      it('deve gerar um Alerta se a temperatura estiver abaixo do mínimo esperado', () => {
        ambiente.validarMedicao('alerta-id', mockDispositivo, 'temperatura', 4)

        expect(Alerta.create).toHaveBeenCalledWith(
          'alerta-id',
          'disp-1',
          '1',
          'sensor_fora_do_range',
          'critico',
          'Valor de temperatura fora do limite esperado',
          true,
          'temperatura',
          4,
          5,
          15,
        )
      })

      it('deve gerar um Alerta se a temperatura estiver acima do máximo esperado', () => {
        ambiente.validarMedicao('alerta-id', mockDispositivo, 'temperatura', 16)

        expect(Alerta.create).toHaveBeenCalledWith(
          'alerta-id',
          'disp-1',
          '1',
          'sensor_fora_do_range',
          'critico',
          'Valor de temperatura fora do limite esperado',
          true,
          'temperatura',
          16,
          5,
          15,
        )
      })
    })

    describe('Validação de Umidade', () => {
      it('deve retornar null se a umidade estiver estritamente dentro do limite', () => {
        const alerta = ambiente.validarMedicao('alerta-id', mockDispositivo, 'umidade', 65)
        expect(alerta).toBeNull()
      })

      it('deve gerar um Alerta se a umidade estiver abaixo do mínimo esperado', () => {
        ambiente.validarMedicao('alerta-id', mockDispositivo, 'umidade', 45)

        expect(Alerta.create).toHaveBeenCalledWith(
          'alerta-id',
          'disp-1',
          '1',
          'sensor_fora_do_range',
          'critico',
          'Valor de umidade fora do limite esperado',
          true,
          'umidade',
          45,
          50,
          80,
        )
      })

      it('deve gerar um Alerta se a umidade estiver acima do máximo esperado', () => {
        ambiente.validarMedicao('alerta-id', mockDispositivo, 'umidade', 85)

        expect(Alerta.create).toHaveBeenCalledWith(
          'alerta-id',
          'disp-1',
          '1',
          'sensor_fora_do_range',
          'critico',
          'Valor de umidade fora do limite esperado',
          true,
          'umidade',
          85,
          50,
          80,
        )
      })
    })
  })

  describe('Caminhos Ruins e Casos de Fronteira (Edge Cases)', () => {
    describe('Valores Exatos de Fronteira (Boundary Values)', () => {
      it('deve aceitar a temperatura exatamente nos valores limites mínimo e máximo sem gerar alerta', () => {
        const alertaNoMinimo = ambiente.validarMedicao(
          'alerta-id',
          mockDispositivo,
          'temperatura',
          5,
        )
        const alertaNoMaximo = ambiente.validarMedicao(
          'alerta-id',
          mockDispositivo,
          'temperatura',
          15,
        )

        expect(alertaNoMinimo).toBeNull()
        expect(alertaNoMaximo).toBeNull()
      })

      it('deve aceitar a umidade exatamente nos valores limites mínimo e máximo sem gerar alerta', () => {
        const alertaNoMinimo = ambiente.validarMedicao('alerta-id', mockDispositivo, 'umidade', 50)
        const alertaNoMaximo = ambiente.validarMedicao('alerta-id', mockDispositivo, 'umidade', 80)

        expect(alertaNoMinimo).toBeNull()
        expect(alertaNoMaximo).toBeNull()
      })
    })

    describe('Brechas de Consistência e Regras de Negócio', () => {
      it('deve permitir a criação de ranges inválidos no método estático create', () => {
        const ambienteInvalido = Ambiente.create('2', 'Falha', 'frio', 30, 10, 90, 40)

        expect(ambienteInvalido.temperaturaMinima).toBe(30)
        expect(ambienteInvalido.temperaturaMaxima).toBe(10)
      })

      it('deve quebrar a validação se o update misturar limites novos com limites antigos de forma inconsistente', () => {
        expect(() => ambiente.update(undefined, undefined, undefined, 4)).toThrow(
          'Temperatura mínima não pode ser maior ou igual à temperatura máxima',
        )
      })

      it('deve lançar erro se o update tentar salvar um valor zero que quebre a regra de negócio', () => {
        expect(() =>
          ambiente.update(undefined, undefined, undefined, undefined, undefined, 0),
        ).toThrow('Umidade mínima não pode ser maior ou igual à umidade máxima')
      })
    })

    describe('Dados Incompletos ou Malformados em Tempo de Execução', () => {
      it('deve lidar com valores falsy na descrição substituindo por "Sem descrição"', () => {
        const ambienteComStringVazia = Ambiente.create('3', 'Teste', 'frio', 5, 15, 50, 80, '')
        expect(ambienteComStringVazia.descricao).toBe('Sem descrição')
      })
    })
  })
})
