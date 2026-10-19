import type {
	DeleteWarehouseInputDto,
	DeleteWarehouseOutputDto,
} from "@application/dtos/delete-warehouse.dto.js";
import type { IUseCase } from "@application/use-cases/use-case.interface.js";
import type { RequestContext } from "@presentation/types/request-context.js";
import { DeleteWarehouseSchema } from "@presentation/validators/schemas/delete-warehouse.schema.js";
import { UnauthorizedError } from "@shared/errors/unauthorized-error.js";
import type { IController } from "./controller.interface.js";

export class DeleteWarehouseController
	implements IController<DeleteWarehouseOutputDto>
{
	private static _instance: DeleteWarehouseController;

	private constructor(
		private readonly useCase: IUseCase<
			DeleteWarehouseInputDto,
			DeleteWarehouseOutputDto
		>,
	) {}

	static instance(
		useCase: IUseCase<DeleteWarehouseInputDto, DeleteWarehouseOutputDto>,
	): DeleteWarehouseController {
		if (!DeleteWarehouseController._instance) {
			DeleteWarehouseController._instance = new DeleteWarehouseController(
				useCase,
			);
		}
		return DeleteWarehouseController._instance;
	}

	async handle(
		input: unknown,
		context: RequestContext,
	): Promise<DeleteWarehouseOutputDto> {
		if (!context.actorId) {
			throw new UnauthorizedError("Id do usuario não encontrado");
		}
		const data = DeleteWarehouseSchema.parse(input);
		return await this.useCase.execute({ ...data, actorId: context.actorId });
	}
}
