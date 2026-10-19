import type {
	CreateWarehouseInputDto,
	CreateWarehouseOutputDto,
} from "@application/dtos/create-warehouse.dto.js";
import type { IUuidProvider } from "@application/ports/uuid-provider.interface.js";
import type { IAuditLogRepository } from "@application/repositories/audit-log.interface.js";
import type { IWarehouseRepository } from "@application/repositories/warehouse.interface.js";
import { AuditLog } from "@domain/entities/audit-log.js";
import { Warehouse } from "@domain/entities/warehouse.js";
import { MeasurementLimits } from "@domain/object-values/measurement-limits.js";
import { ConflictError } from "@shared/errors/conflict-error.js";
import type { IUseCase } from "./use-case.interface.js";

export class CreateWarehouseUseCase
	implements IUseCase<CreateWarehouseInputDto, CreateWarehouseOutputDto>
{
	private static _instance: CreateWarehouseUseCase;

	private constructor(
		private readonly uuidProvider: IUuidProvider,
		private readonly warehouseRepo: IWarehouseRepository,
		private readonly auditLogRepo: IAuditLogRepository,
	) {}

	static instance(
		uuidProvider: IUuidProvider,
		warehouseRepo: IWarehouseRepository,
		auditLogRepo: IAuditLogRepository,
	): CreateWarehouseUseCase {
		if (!CreateWarehouseUseCase._instance) {
			CreateWarehouseUseCase._instance = new CreateWarehouseUseCase(
				uuidProvider,
				warehouseRepo,
				auditLogRepo,
			);
		}
		return CreateWarehouseUseCase._instance;
	}

	async execute(
		input: CreateWarehouseInputDto,
	): Promise<CreateWarehouseOutputDto> {
		input.name = input.name.trim();
		const warehouseExist = await this.warehouseRepo.findByName(input.name);

		if (warehouseExist) {
			throw new ConflictError("Já existe um armazém com esse nome");
		}

		const warehouse = Warehouse.create({
			id: this.uuidProvider.generate(),
			name: input.name,
			condition: input.condition,
			category: input.category,
			...(input.description && { description: input.description }),
			...(input.limits && {
				limits: new MeasurementLimits(
					input.limits.temperature,
					input.limits.humidity,
				),
			}),
		});

		const auditLog = AuditLog.create({
			id: this.uuidProvider.generate(),
			action: "create",
			createdAt: new Date(),
			resourceId: warehouse.id,
			resourceType: "warehouse",
			actorId: input.actorId,
		});

		await this.warehouseRepo.save(warehouse);

		await this.auditLogRepo.save(auditLog);

		return {
			message: "Armazém criado com sucesso",
			warehouse: {
				id: warehouse.id,
				category: warehouse.category,
				condition: warehouse.condition,
				description: warehouse.description,
				name: warehouse.name,
				...(warehouse.limits && {
					limits: {
						temperature: warehouse.limits.temperature,
						humidity: warehouse.limits.humidity,
					},
				}),
			},
		};
	}
}
