import type { MeasurementLimit } from "@domain/types/measurement-limit.js";
import { UnprocessableEntityError } from "@shared/errors/unprocessable-entity-error.js";

export class MeasurementLimits {
	constructor(
		private _temperature: MeasurementLimit,
		private _humidity: MeasurementLimit,
	) {
		this.isValidTemperatureLimits();
		this.isValidHumidityLimits();
	}

	get temperature(): MeasurementLimit {
		return this._temperature;
	}

	get humidity(): MeasurementLimit {
		return this._humidity;
	}

	private isValidTemperatureLimits(): void {
		if (this._temperature.min >= this._temperature.max) {
			throw new UnprocessableEntityError(
				"Limite mínimo de temperatura não pode ser maior que o máximo",
			);
		}
	}

	private isValidHumidityLimits(): void {
		if (this._humidity.min >= this._humidity.max) {
			throw new UnprocessableEntityError(
				"Limite mínimo de temperatura não pode ser maior que o máximo",
			);
		}

		if (this._humidity.min < 0 || this._humidity.min > 100) {
			throw new UnprocessableEntityError(
				"O valor minimo de umidade deve estar entre 0 e 100",
			);
		}

		if (this._humidity.max < 0 || this._humidity.max > 100) {
			throw new UnprocessableEntityError(
				"O valor maximo de umidade deve estar entre 0 e 100",
			);
		}
	}
}
