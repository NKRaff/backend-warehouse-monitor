export abstract class AppError extends Error {
	constructor(
		message: string,
		public readonly statusCode: number,
		public readonly code: string,
		cause?: object,
	) {
		super(message, { cause });
		this.name = this.constructor.name;
		this.statusCode = statusCode;

		Error.captureStackTrace(this, this.constructor);
	}
}
