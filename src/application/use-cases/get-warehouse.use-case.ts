import type {
	GetWarehouseInputDto,
	GetWarehouseOutputDto,
} from "@application/dtos/get-warehouse.dto.js";
import type { IWarehouseRepository } from "@application/repositories/warehouse.interface.js";
import { NotFoundError } from "@shared/errors/not-found-error.js";
import type { IUseCase } from "./use-case.interface.js";

export class GetWarehouseUseCase
	implements IUseCase<GetWarehouseInputDto, GetWarehouseOutputDto>
{
	private static _instance: GetWarehouseUseCase;

	private constructor(private warehouseRepo: IWarehouseRepository) {}

	static instance(warehouseRepo: IWarehouseRepository) {
		if (!GetWarehouseUseCase._instance) {
			GetWarehouseUseCase._instance = new GetWarehouseUseCase(warehouseRepo);
		}
		return GetWarehouseUseCase._instance;
	}

	async execute(input: GetWarehouseInputDto): Promise<GetWarehouseOutputDto> {
		const warehouse = await this.warehouseRepo.findById(input.warehouseId);

		if (warehouse === null) {
			throw new NotFoundError("Armazém não encontrato");
		}

		return {
			message: "Armazém encontrato",
			warehouse: {
				category: warehouse.category,
				condition: warehouse.condition,
				description: warehouse.description,
				id: warehouse.id,
				status: warehouse.status,
				...(warehouse.deletedAt && { deletedAt: warehouse.deletedAt }),
				...(warehouse.limits && {
					limits: {
						humidity: warehouse.limits.humidity,
						temperature: warehouse.limits.temperature,
					},
				}),
			},
		};
	}
}
