import type { Ambiente } from './ambiente.entity.js'

export interface AmbienteRepository {
  save(ambiente: Ambiente): Promise<void>
  findAll(): Promise<Ambiente[]>
  findById(id: string): Promise<Ambiente>
  update(ambiente: Ambiente): Promise<void>
  delete(id: string): Promise<void>
}
