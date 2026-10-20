import type {
	UpdateWarehouseInputDto,
	UpdateWarehouseOutputDto,
} from "@application/dtos/update-warehouse.js";
import type { IUuidProvider } from "@application/ports/uuid-provider.interface.js";
import type { IAuditLogRepository } from "@application/repositories/audit-log.interface.js";
import type { IWarehouseRepository } from "@application/repositories/warehouse.interface.js";
import { AuditLog } from "@domain/entities/audit-log.js";
import { AuditAction } from "@domain/types/audit-action.js";
import { AuditResource } from "@domain/types/audit-resource.js";
import { NotFoundError } from "@shared/errors/not-found-error.js";
import { UnprocessableEntityError } from "@shared/errors/unprocessable-entity-error.js";
import type { IUseCase } from "./use-case.interface.js";

export class UpdateWarehouseUseCase
	implements IUseCase<UpdateWarehouseInputDto, UpdateWarehouseOutputDto>
{
	private static _instance: UpdateWarehouseUseCase;

	private constructor(
		private readonly uuidProvider: IUuidProvider,
		private readonly warehouseRepo: IWarehouseRepository,
		private readonly auditLogRepo: IAuditLogRepository,
	) {}

	static instance(
		uuidProvider: IUuidProvider,
		warehouseRepo: IWarehouseRepository,
		auditLogRepo: IAuditLogRepository,
	): UpdateWarehouseUseCase {
		if (!UpdateWarehouseUseCase._instance) {
			UpdateWarehouseUseCase._instance = new UpdateWarehouseUseCase(
				uuidProvider,
				warehouseRepo,
				auditLogRepo,
			);
		}
		return UpdateWarehouseUseCase._instance;
	}

	async execute(
		input: UpdateWarehouseInputDto,
	): Promise<UpdateWarehouseOutputDto> {
		const { actorId, warehouse } = input;

		warehouse.name = warehouse.name?.trim();

		if (warehouse.name !== undefined && warehouse.name.length < 4) {
			throw new UnprocessableEntityError(
				"O nome deve ter no minimo 4 caracteres",
			);
		}

		const hasOptionalAttribute = Object.entries(warehouse).some(
			([key, value]) => key !== "id" && value !== undefined,
		);

		if (!hasOptionalAttribute) {
			throw new UnprocessableEntityError("Nenhum atributo para alterar");
		}

		const warehouseExist = await this.warehouseRepo.findById(warehouse.id);

		if (warehouseExist === null) {
			throw new NotFoundError("Nenhum armazém relacionado ao id");
		}

		await this.warehouseRepo.updateById(
			warehouse.id,
			warehouse.name,
			warehouse.condition,
			warehouse.category,
			warehouse.status,
			warehouse.description,
			warehouse.limits,
		);

		const auditLog = AuditLog.create({
			action: AuditAction.UPDATE,
			createdAt: new Date(),
			id: this.uuidProvider.generate(),
			resourceId: warehouse.id,
			resourceType: AuditResource.WAREHOUSE,
			actorId,
			metadata: {
				old: {
					...(warehouse.category && { category: warehouseExist.category }),
					...(warehouse.condition && { condition: warehouseExist.condition }),
					...(warehouse.description && {
						description: warehouseExist.description,
					}),
					...(warehouse.limits &&
						warehouseExist.limits && {
							limits: {
								temperature: warehouseExist.limits.temperature,
								humidity: warehouseExist.limits.humidity,
							},
						}),
					...(warehouse.name && { name: warehouseExist.name }),
					...(warehouse.status && { status: warehouseExist.status }),
				},
				new: {
					...(warehouse.category && { category: warehouse.category }),
					...(warehouse.condition && { condition: warehouse.condition }),
					...(warehouse.description && { description: warehouse.description }),
					...(warehouse.limits && {
						limits: {
							temperature: warehouse.limits.temperature,
							humidity: warehouse.limits.humidity,
						},
					}),
					...(warehouse.name && { name: warehouse.name }),
					...(warehouse.status && { status: warehouse.status }),
				},
			},
		});

		await this.auditLogRepo.save(auditLog);

		const limits = warehouse.limits ?? warehouseExist.limits;

		return {
			message: "Armazém atualizado com sucesso",
			warehouse: {
				id: warehouse.id,
				category: warehouse.category ?? warehouseExist.category,
				condition: warehouse.condition ?? warehouseExist.condition,
				description: warehouse.description ?? warehouseExist.description,
				name: warehouse.name ?? warehouseExist.name,
				status: warehouse.status ?? warehouseExist.status,
				...(limits && {
					limits: {
						temperature: limits.temperature,
						humidity: limits.humidity,
					},
				}),
			},
		};
	}
}
