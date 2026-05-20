import { beforeEach, describe, expect, it } from 'vitest'
import { Alerta } from './alerta.entity.js'

describe('Alerta', () => {
  let alertaCompleto: Alerta
  let alertaMinimo: Alerta

  beforeEach(() => {
    alertaCompleto = Alerta.create(
      'alerta-1',
      'disp-1',
      'amb-1',
      'sensor_fora_do_range',
      'critico',
      'Temperatura fora do limite',
      true,
      'temperatura',
      25,
      5,
      15,
    )

    alertaMinimo = Alerta.create(
      'alerta-2',
      'disp-1',
      'amb-1',
      'dispositivo_inoperante',
      'aviso',
      'Dispositivo desconectado',
      false,
    )
  })

  describe('Criação e Atributos', () => {
    it('deve retornar os atributos obrigatórios e opcionais corretamente', () => {
      expect(alertaCompleto.id).toBe('alerta-1')
      expect(alertaCompleto.dispositivoId).toBe('disp-1')
      expect(alertaCompleto.ambienteId).toBe('amb-1')
      expect(alertaCompleto.tipo).toBe('sensor_fora_do_range')
      expect(alertaCompleto.nivel).toBe('critico')
      expect(alertaCompleto.mensagem).toBe('Temperatura fora do limite')
      expect(alertaCompleto.ativo).toBe(true)
      expect(alertaCompleto.sensorTipo).toBe('temperatura')
      expect(alertaCompleto.valorAtual).toBe(25)
      expect(alertaCompleto.limiteMin).toBe(5)
      expect(alertaCompleto.limiteMax).toBe(15)
    })

    it('deve retornar os atributos obrigatórios em um alerta mínimo', () => {
      expect(alertaMinimo.id).toBe('alerta-2')
      expect(alertaMinimo.tipo).toBe('dispositivo_inoperante')
      expect(alertaMinimo.nivel).toBe('aviso')
      expect(alertaMinimo.ativo).toBe(false)
    })
  })

  describe('Gerenciamento de Estado (Ciclo de Vida)', () => {
    it('deve encerrar o alerta alterando a propriedade ativo para false', () => {
      expect(alertaCompleto.ativo).toBe(true)
      alertaCompleto.encerrar()
      expect(alertaCompleto.ativo).toBe(false)
    })

    it('deve ativar o alerta alterando a propriedade ativo para true', () => {
      expect(alertaMinimo.ativo).toBe(false)
      alertaMinimo.ativar()
      expect(alertaMinimo.ativo).toBe(true)
    })
  })

  describe('Caminhos Ruins e Inconsistências de Dados', () => {
    it('deve aceitar dados inconsistentes se o tipo for mal combinado', () => {
      const alertaInconsistente = Alerta.create(
        'alerta-misto',
        'disp-1',
        'amb-1',
        'dispositivo_inoperante',
        'critico',
        'Dispositivo offline',
        true,
        'umidade',
        95,
        20,
        80,
      )

      expect(alertaInconsistente.tipo).toBe('dispositivo_inoperante')
      expect(alertaInconsistente.sensorTipo).toBe('umidade')
    })

    it('deve permitir limites numéricos matematicamente invertidos no alerta', () => {
      const alertaLimitesInvertidos = Alerta.create(
        'alerta-invalido',
        'disp-1',
        'amb-1',
        'sensor_fora_do_range',
        'critico',
        'Mensagem de erro',
        true,
        'temperatura',
        10,
        50,
        10,
      )

      expect(alertaLimitesInvertidos.limiteMin).toBe(50)
      expect(alertaLimitesInvertidos.limiteMax).toBe(10)
    })
  })
})
