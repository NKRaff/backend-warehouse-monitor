import type {
	DeleteDeviceInputDto,
	DeleteDeviceOutputDto,
} from "@application/dtos/delete-device.dto.js";
import type { IMqttClient } from "@application/ports/mqtt-client.interface.js";
import type { IUuidProvider } from "@application/ports/uuid-provider.interface.js";
import type { IAuditLogRepository } from "@application/repositories/audit-log.interface.js";
import type { IDeviceRepository } from "@application/repositories/device.interface.js";
import { AuditLog } from "@domain/entities/audit-log.js";
import { NotFoundError } from "@shared/errors/not-found-error.js";
import type { IUseCase } from "./use-case.interface.js";

export class DeleteDeviceUseCase
	implements IUseCase<DeleteDeviceInputDto, DeleteDeviceOutputDto>
{
	private static _instance: DeleteDeviceUseCase;

	private constructor(
		private readonly uuidProvider: IUuidProvider,
		private readonly mqttClient: IMqttClient,
		private readonly deviceRepo: IDeviceRepository,
		private readonly auditLogRepo: IAuditLogRepository,
	) {}

	static instance(
		uuidProvider: IUuidProvider,
		mqttClient: IMqttClient,
		deviceRepo: IDeviceRepository,
		auditLogRepo: IAuditLogRepository,
	): DeleteDeviceUseCase {
		if (!DeleteDeviceUseCase._instance) {
			DeleteDeviceUseCase._instance = new DeleteDeviceUseCase(
				uuidProvider,
				mqttClient,
				deviceRepo,
				auditLogRepo,
			);
		}
		return DeleteDeviceUseCase._instance;
	}

	async execute(input: DeleteDeviceInputDto): Promise<DeleteDeviceOutputDto> {
		const device = await this.deviceRepo.findById(input.deviceId);

		if (device === null) {
			throw new NotFoundError("Dispositivo não encontrado");
		}

		const log = AuditLog.create({
			action: "delete",
			createdAt: new Date(),
			id: this.uuidProvider.generate(),
			resourceId: device.mac,
			resourceType: "device",
			actorId: input.actorId,
		});

		await this.auditLogRepo.save(log);

		await this.mqttClient.unsubscribe(`device/${device.mac}/*`);

		await this.deviceRepo.deleteById(device.mac);

		return {
			message: "Dispositivo excluido com sucesso",
		};
	}
}
