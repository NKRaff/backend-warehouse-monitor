import { AppError } from "./app-error.js";

export class TooManyRequestsError extends AppError {
	constructor(message = "Too many requests", cause?: object) {
		super(message, 429, "TOO_MANY_REQUESTS", cause);
	}
}
