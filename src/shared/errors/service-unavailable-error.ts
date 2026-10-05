import { AppError } from "./app-error.js";

export class ServiceUnavailableError extends AppError {
	constructor(message = "Service unavailable") {
		super(message, 503, "SERVICE_UNAVAILABLE");
	}
}
