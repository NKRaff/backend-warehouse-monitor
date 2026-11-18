import type {
	ListAllMeasurementInputDto,
	ListAllMeasurementOutputDto,
} from "@application/dtos/list-all-measurement.dto.js";
import type { IUseCase } from "@application/use-cases/use-case.interface.js";
import type { RequestContext } from "@presentation/types/request-context.js";
import { ListAllMeasurementSchema } from "@presentation/validators/schemas/list-all-measurement.schema.js";
import type { IController } from "./controller.interface.js";

export class ListAllMeasurementController
	implements IController<ListAllMeasurementOutputDto>
{
	private static _instance: ListAllMeasurementController;

	private constructor(
		private readonly useCase: IUseCase<
			ListAllMeasurementInputDto,
			ListAllMeasurementOutputDto
		>,
	) {}

	static instance(
		useCase: IUseCase<ListAllMeasurementInputDto, ListAllMeasurementOutputDto>,
	): ListAllMeasurementController {
		if (!ListAllMeasurementController._instance) {
			ListAllMeasurementController._instance = new ListAllMeasurementController(
				useCase,
			);
		}
		return ListAllMeasurementController._instance;
	}

	async handle(
		input: unknown,
		_context: RequestContext,
	): Promise<ListAllMeasurementOutputDto> {
		const data = ListAllMeasurementSchema.parse(input);
		return await this.useCase.execute(data);
	}
}
