import type { Ambiente } from './ambiente.entity.js'

export interface AmbienteRepository {
  save(ambiente: Ambiente): Promise<void>
  findAll(): Promise<Ambiente[]>
}
