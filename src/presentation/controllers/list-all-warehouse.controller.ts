import type {
	ListAllWarehouseInputDto,
	ListAllWarehouseOutputDto,
} from "@application/dtos/list-all-warehouse.dto.js";
import type { IUseCase } from "@application/use-cases/use-case.interface.js";
import type { RequestContext } from "@presentation/types/request-context.js";
import { ListAllWarehouseSchema } from "@presentation/validators/schemas/list-all-warehouse.schema.js";
import type { IController } from "./controller.interface.js";

export class ListAllWarehouseController
	implements IController<ListAllWarehouseOutputDto>
{
	private static _instance: ListAllWarehouseController;

	private constructor(
		private readonly useCase: IUseCase<
			ListAllWarehouseInputDto,
			ListAllWarehouseOutputDto
		>,
	) {}

	static instance(
		useCase: IUseCase<ListAllWarehouseInputDto, ListAllWarehouseOutputDto>,
	): ListAllWarehouseController {
		if (!ListAllWarehouseController._instance) {
			ListAllWarehouseController._instance = new ListAllWarehouseController(
				useCase,
			);
		}
		return ListAllWarehouseController._instance;
	}

	async handle(
		input: unknown,
		_context: RequestContext,
	): Promise<ListAllWarehouseOutputDto> {
		const data = ListAllWarehouseSchema.parse(input);
		return await this.useCase.execute(data);
	}
}
