import type {
	UpdateWarehouseInputDto,
	UpdateWarehouseOutputDto,
} from "@application/dtos/update-warehouse.js";
import type { IUseCase } from "@application/use-cases/use-case.interface.js";
import { MeasurementLimits } from "@domain/object-values/measurement-limits.js";
import type { RequestContext } from "@presentation/types/request-context.js";
import { UpdateWarehouseSchema } from "@presentation/validators/schemas/update-warehouse.schema.js";
import { UnauthorizedError } from "@shared/errors/unauthorized-error.js";
import type { IController } from "./controller.interface.js";

export class UpdateWarehouseController
	implements IController<UpdateWarehouseOutputDto>
{
	private static _instance: UpdateWarehouseController;

	private constructor(
		private readonly useCase: IUseCase<
			UpdateWarehouseInputDto,
			UpdateWarehouseOutputDto
		>,
	) {}

	static instance(
		useCase: IUseCase<UpdateWarehouseInputDto, UpdateWarehouseOutputDto>,
	): UpdateWarehouseController {
		if (!UpdateWarehouseController._instance) {
			UpdateWarehouseController._instance = new UpdateWarehouseController(
				useCase,
			);
		}
		return UpdateWarehouseController._instance;
	}

	async handle(
		input: unknown,
		context: RequestContext,
	): Promise<UpdateWarehouseOutputDto> {
		if (!context.actorId) {
			throw new UnauthorizedError("Id do usuario não encontrado");
		}

		const data = UpdateWarehouseSchema.parse(input);

		const limits =
			data.limits === undefined
				? undefined
				: new MeasurementLimits(
						{
							min: data.limits.temperature.min,
							max: data.limits.temperature.max,
						},
						{
							min: data.limits.humidity.min,
							max: data.limits.humidity.max,
						},
					);

		return await this.useCase.execute({
			actorId: context.actorId,
			warehouse: {
				...data,
				limits,
			},
		});
	}
}
