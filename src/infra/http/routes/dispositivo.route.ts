import { Router } from 'express'
import type { AtualizarDispositivoController } from '../../../interface/dispositivo/atualizar-dispositivo/atualizar-dispositivo.controller.js'
import type { CadastrarDispositivoController } from '../../../interface/dispositivo/cadastrar-dispositivo/cadastrar-dispositivo.controller.js'
import type { ListarDispositivosController } from '../../../interface/dispositivo/listar-dispositivos/listar-dispositivos.controller.js'
import type { RemoverDispositivoController } from '../../../interface/dispositivo/remover-dispositivo/remover-dispositivo.controller.js'
import type { MqttTopicSubscriber } from '../../mqtt/topic-subscriber.js'
import { autenticarToken } from '../middlewares/autenticacao.middleware.js'

export class DispositivoRoutes {
  public readonly routes: Router

  private constructor(
    private readonly cadastrarDispositivoController: CadastrarDispositivoController,
    private readonly listarDispositivoController: ListarDispositivosController,
    private readonly atualizarDispositivoController: AtualizarDispositivoController,
    private readonly removerDispositivoController: RemoverDispositivoController,
    private readonly topicSubscriber: MqttTopicSubscriber,
  ) {
    this.routes = Router()
    this.setupRoutes()
  }

  public static create(
    cadastrarDispositivoController: CadastrarDispositivoController,
    listarDispositivoController: ListarDispositivosController,
    atualizarDispositivoController: AtualizarDispositivoController,
    removerDispositivoController: RemoverDispositivoController,
    topicSubscriber: MqttTopicSubscriber,
  ) {
    return new DispositivoRoutes(
      cadastrarDispositivoController,
      listarDispositivoController,
      atualizarDispositivoController,
      removerDispositivoController,
      topicSubscriber,
    )
  }

  private setupRoutes() {
    this.routes.post('/', autenticarToken, async (req, res) => {
      try {
        const result = await this.cadastrarDispositivoController.handle(req.body)
        res.status(201).json(result)
      } catch (error) {
        res.status(400).json(error)
      }
    })

    this.routes.get('/', autenticarToken, async (_req, res) => {
      try {
        const result = await this.listarDispositivoController.handle()
        res.status(200).json(result)
      } catch (error) {
        res.status(400).json(error)
      }
    })

    this.routes.patch('/:id', autenticarToken, async (req, res) => {
      try {
        const result = await this.atualizarDispositivoController.handle({
          id: req.params.id,
          ...req.body,
        })

        if (result.ambienteId) {
          await this.topicSubscriber.dispositivoSubscribe(result.id)
        } else {
          await this.topicSubscriber.dispositivoUnsubscribe(result.id)
        }

        res.status(200).json(result)
      } catch (error) {
        res.status(400).json(error)
      }
    })

    this.routes.delete('/:id', autenticarToken, async (req, res) => {
      try {
        const result = await this.removerDispositivoController.handle({ id: req.params.id })
        res.status(200).json(result)
      } catch (error) {
        res.status(400).json(error)
      }
    })
  }
}
