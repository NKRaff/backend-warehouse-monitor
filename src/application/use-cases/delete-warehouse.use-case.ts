import type {
	DeleteWarehouseInputDto,
	DeleteWarehouseOutputDto,
} from "@application/dtos/delete-warehouse.dto.js";
import type { IUuidProvider } from "@application/ports/uuid-provider.interface.js";
import type { IAuditLogRepository } from "@application/repositories/audit-log.interface.js";
import type { IDeviceRepository } from "@application/repositories/device.interface.js";
import type { IWarehouseRepository } from "@application/repositories/warehouse.interface.js";
import { AuditLog } from "@domain/entities/audit-log.js";
import type { IUseCase } from "./use-case.interface.js";

export class DeleteWarehouseUseCase
	implements IUseCase<DeleteWarehouseInputDto, DeleteWarehouseOutputDto>
{
	private static _instance: DeleteWarehouseUseCase;

	private constructor(
		private readonly uuidProvider: IUuidProvider,
		private readonly warehouseRepo: IWarehouseRepository,
		private readonly auditLogRepo: IAuditLogRepository,
		private readonly deviceRepo: IDeviceRepository,
	) {}

	static instance(
		uuidProvider: IUuidProvider,
		warehouseRepo: IWarehouseRepository,
		auditLogRepo: IAuditLogRepository,
		deviceRepo: IDeviceRepository,
	): DeleteWarehouseUseCase {
		if (!DeleteWarehouseUseCase._instance) {
			DeleteWarehouseUseCase._instance = new DeleteWarehouseUseCase(
				uuidProvider,
				warehouseRepo,
				auditLogRepo,
				deviceRepo,
			);
		}
		return DeleteWarehouseUseCase._instance;
	}

	async execute(
		input: DeleteWarehouseInputDto,
	): Promise<DeleteWarehouseOutputDto> {
		await this.deviceRepo.unlinkWarehouse(input.warehouseId);

		await this.warehouseRepo.deletedById(input.warehouseId);

		const auditLog = AuditLog.create({
			action: "delete",
			createdAt: new Date(),
			id: this.uuidProvider.generate(),
			resourceId: input.warehouseId,
			resourceType: "warehouse",
			actorId: input.actorId,
		});

		await this.auditLogRepo.save(auditLog);

		return {
			message: "Armazém excluido com sucesso",
		};
	}
}
