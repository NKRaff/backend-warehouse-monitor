import { AppError } from "./app-error.js";

export class UnprocessableEntityError extends AppError {
	constructor(message = "Unprocessable entity") {
		super(message, 422, "UNPROCESSABLE_ENTITY");
	}
}
