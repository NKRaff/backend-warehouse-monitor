import type {
	SaveMeasurementInputDto,
	SaveMeasurementOutputDto,
} from "@application/dtos/save-measurement.dto.js";
import type { IUseCase } from "@application/use-cases/use-case.interface.js";
import type { RequestContext } from "@presentation/types/request-context.js";
import { SaveMeasurementSchema } from "@presentation/validators/schemas/save-measurement.schema.js";
import type { IController } from "./controller.interface.js";

export class SaveMeasurementController
	implements IController<SaveMeasurementOutputDto>
{
	private static _instance: SaveMeasurementController;

	private constructor(
		private readonly useCase: IUseCase<
			SaveMeasurementInputDto,
			SaveMeasurementOutputDto
		>,
	) {}

	static instance(
		useCase: IUseCase<SaveMeasurementInputDto, SaveMeasurementOutputDto>,
	): SaveMeasurementController {
		if (!SaveMeasurementController._instance) {
			SaveMeasurementController._instance = new SaveMeasurementController(
				useCase,
			);
		}
		return SaveMeasurementController._instance;
	}

	async handle(
		input: {
			mac: string;
			payload: Buffer;
		},
		_context: RequestContext,
	): Promise<SaveMeasurementOutputDto> {
		const { mac, payload } = input;
		const payloadData = JSON.parse(payload.toString());
		const data = SaveMeasurementSchema.parse({
			...payloadData,
			deviceId: mac,
		});
		return await this.useCase.execute(data);
	}
}
