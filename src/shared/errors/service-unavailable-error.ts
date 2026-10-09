import { AppError } from "./app-error.js";

export class ServiceUnavailableError extends AppError {
	constructor(message = "Service unavailable", cause?: object) {
		super(message, 503, "SERVICE_UNAVAILABLE", cause);
	}
}
