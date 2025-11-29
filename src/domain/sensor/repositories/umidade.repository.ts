import type { Umidade } from '../entities/umidade.entity.js'

export interface UmidadeRepository {
  save(umidade: Umidade): Promise<void>
  findAll(): Promise<Umidade[]>
}
