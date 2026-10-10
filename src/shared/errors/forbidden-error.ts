import { AppError } from "./app-error.js";

export class ForbiddenError extends AppError {
	constructor(message = "Forbidden", cause?: object) {
		super(message, 403, "FORBIDDEN", cause);
	}
}
