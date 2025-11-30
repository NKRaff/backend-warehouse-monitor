import type { Dispositivo } from './dispositivo.entity.js'

export interface DispositivoRepository {
  save(dispositivo: Dispositivo): Promise<void>
  findAll(): Promise<Dispositivo[]>
  findById(id: string): Promise<Dispositivo>
  update(dispositivo: Dispositivo): Promise<void>
  delete(id: string): Promise<void>
}
