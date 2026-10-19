import type {
	CreateWarehouseInputDto,
	CreateWarehouseOutputDto,
} from "@application/dtos/create-warehouse.dto.js";
import type { IUseCase } from "@application/use-cases/use-case.interface.js";
import type { RequestContext } from "@presentation/types/request-context.js";
import { CreateWarehouseSchema } from "@presentation/validators/schemas/create-warehouse.schema.js";
import { UnauthorizedError } from "@shared/errors/unauthorized-error.js";
import type { IController } from "./controller.interface.js";

export class CreateWarehouseController
	implements IController<CreateWarehouseOutputDto>
{
	private static _instance: CreateWarehouseController;

	private constructor(
		private readonly useCase: IUseCase<
			CreateWarehouseInputDto,
			CreateWarehouseOutputDto
		>,
	) {}

	static instance(
		useCase: IUseCase<CreateWarehouseInputDto, CreateWarehouseOutputDto>,
	): CreateWarehouseController {
		if (!CreateWarehouseController._instance) {
			CreateWarehouseController._instance = new CreateWarehouseController(
				useCase,
			);
		}
		return CreateWarehouseController._instance;
	}

	async handle(
		input: unknown,
		context: RequestContext,
	): Promise<CreateWarehouseOutputDto> {
		if (!context.actorId) {
			throw new UnauthorizedError("Id do usuario não encontrado");
		}
		const data = CreateWarehouseSchema.parse(input);
		return await this.useCase.execute({ ...data, actorId: context.actorId });
	}
}
