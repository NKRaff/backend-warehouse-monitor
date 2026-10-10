import { AppError } from "./app-error.js";

export class NotFoundError extends AppError {
	constructor(message = "Resource not found", cause?: object) {
		super(message, 404, "RESOURCE_NOT_FOUND", cause);
	}
}
