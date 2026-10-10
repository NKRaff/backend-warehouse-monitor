import { AppError } from "./app-error.js";

export class BadGatewayError extends AppError {
	constructor(message = "Bad gateway", cause?: object) {
		super(message, 502, "BAD_GATEWAY", cause);
	}
}
