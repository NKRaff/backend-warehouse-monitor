import { AppError } from "./app-error.js";

export class BadRequestError extends AppError {
	constructor(message = "Bad request", cause?: object) {
		super(message, 400, "BAD_REQUEST", cause);
	}
}
