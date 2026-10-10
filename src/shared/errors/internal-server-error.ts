import { AppError } from "./app-error.js";

export class InternalServerError extends AppError {
	constructor(message = "Internal server error", cause?: object) {
		super(message, 500, "INTERNAL_SERVER_ERROR", cause);
	}
}
