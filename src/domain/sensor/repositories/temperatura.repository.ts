import type { Temperatura } from '../entities/temperatura.entity.js'

export interface TemperaturaRepository {
  save(temperatura: Temperatura): Promise<void>
  findAll(): Promise<Temperatura[]>
}
