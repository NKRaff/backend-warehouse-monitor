import type {
	ListAllWarehouseInputDto,
	ListAllWarehouseOutputDto,
} from "@application/dtos/list-all-warehouse.dto.js";
import type { IWarehouseRepository } from "@application/repositories/warehouse.interface.js";
import type { IUseCase } from "./use-case.interface.js";

export class ListAllWarehouseUseCase
	implements IUseCase<ListAllWarehouseInputDto, ListAllWarehouseOutputDto>
{
	private static _instance: ListAllWarehouseUseCase;

	private constructor(private warehouseRepo: IWarehouseRepository) {}

	static instance(warehouseRepo: IWarehouseRepository) {
		if (!ListAllWarehouseUseCase._instance) {
			ListAllWarehouseUseCase._instance = new ListAllWarehouseUseCase(
				warehouseRepo,
			);
		}
		return ListAllWarehouseUseCase._instance;
	}

	async execute(
		input: ListAllWarehouseInputDto,
	): Promise<ListAllWarehouseOutputDto> {
		const warehouses = await this.warehouseRepo.findAll(
			input.offSet,
			input.limit,
		);

		return {
			message: "List de Armazéns encontrado",
			warehouses: warehouses.map((warehouse) => {
				return {
					id: warehouse.id,
					category: warehouse.category,
					condition: warehouse.condition,
					name: warehouse.name,
					status: warehouse.status,
				};
			}),
		};
	}
}
