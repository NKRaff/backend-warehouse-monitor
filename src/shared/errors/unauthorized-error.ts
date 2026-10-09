import { AppError } from "./app-error.js";

export class UnauthorizedError extends AppError {
	constructor(message = "Unauthorized", cause?: object) {
		super(message, 401, "UNAUTHORIZED", cause);
	}
}
