import { AppError } from "./app-error.js";

export class ConflictError extends AppError {
	constructor(message = "Resource already exists", cause?: object) {
		super(message, 409, "RESOURCE_CONFLICT", cause);
	}
}
