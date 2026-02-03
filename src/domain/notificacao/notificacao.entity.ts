export type NotificacaoProps = {
  id: string
  alertaId: string
  usuarioId: string
  lida?: boolean
}

export class Notificacao {
  private constructor(private props: NotificacaoProps) {}

  public static create(id: string, alertaId: string, usuarioId: string, lida?: boolean) {
    if (lida === undefined || lida === null) lida = false
    return new Notificacao({ id, alertaId, usuarioId, lida })
  }

  public marcarComoLida() {
    this.props.lida = true
  }

  public get id(): string {
    return this.props.id
  }

  public get alertaId(): string {
    return this.props.alertaId
  }

  public get usuarioId(): string {
    return this.props.usuarioId
  }

  public get lida(): boolean {
    if (this.props.lida === undefined || this.props.lida === null) return false
    return this.props.lida
  }
}
