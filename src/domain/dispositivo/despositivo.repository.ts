import type { Dispositivo } from './dispositivo.entity.js'

export interface DispositivoRepository {
  save(dispositivo: Dispositivo): Promise<void>
  findAll(): Promise<Dispositivo[]>
}
