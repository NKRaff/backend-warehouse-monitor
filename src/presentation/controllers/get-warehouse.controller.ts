import type {
	GetWarehouseInputDto,
	GetWarehouseOutputDto,
} from "@application/dtos/get-warehouse.dto.js";
import type { IUseCase } from "@application/use-cases/use-case.interface.js";
import type { RequestContext } from "@presentation/types/request-context.js";
import { GetWarehouseSchema } from "@presentation/validators/schemas/get-warehouse.schema.js";
import type { IController } from "./controller.interface.js";

export class GetWarehouseController
	implements IController<GetWarehouseOutputDto>
{
	private static _instance: GetWarehouseController;

	private constructor(
		private readonly useCase: IUseCase<
			GetWarehouseInputDto,
			GetWarehouseOutputDto
		>,
	) {}

	static instance(
		useCase: IUseCase<GetWarehouseInputDto, GetWarehouseOutputDto>,
	): GetWarehouseController {
		if (!GetWarehouseController._instance) {
			GetWarehouseController._instance = new GetWarehouseController(useCase);
		}
		return GetWarehouseController._instance;
	}

	async handle(
		input: unknown,
		_context: RequestContext,
	): Promise<GetWarehouseOutputDto> {
		const data = GetWarehouseSchema.parse(input);
		return await this.useCase.execute(data);
	}
}
