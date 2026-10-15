import { AppError } from "@shared/errors/app-error.js";
import { BadGatewayError } from "@shared/errors/bad-gateway-error.js";
import { BadRequestError } from "@shared/errors/bad-request-error.js";
import { ConflictError } from "@shared/errors/conflict-error.js";
import { ForbiddenError } from "@shared/errors/forbidden-error.js";
import { InternalServerError } from "@shared/errors/internal-server-error.js";
import { NotFoundError } from "@shared/errors/not-found-error.js";
import { ServiceUnavailableError } from "@shared/errors/service-unavailable-error.js";
import { TooManyRequestsError } from "@shared/errors/too-many-request-error.js";
import { UnauthorizedError } from "@shared/errors/unauthorized-error.js";
import { UnprocessableEntityError } from "@shared/errors/unprocessable-entity-error.js";
import { describe, expect, it } from "vitest";

const cases = [
	{ name: "BadRequestError", ErrorClass: BadRequestError, status: 400, code: "BAD_REQUEST", message: "Bad request" },
	{ name: "UnauthorizedError", ErrorClass: UnauthorizedError, status: 401, code: "UNAUTHORIZED", message: "Unauthorized" },
	{ name: "ForbiddenError", ErrorClass: ForbiddenError, status: 403, code: "FORBIDDEN", message: "Forbidden" },
	{ name: "NotFoundError", ErrorClass: NotFoundError, status: 404, code: "RESOURCE_NOT_FOUND", message: "Resource not found" },
	{ name: "ConflictError", ErrorClass: ConflictError, status: 409, code: "RESOURCE_CONFLICT", message: "Resource already exists" },
	{ name: "UnprocessableEntityError", ErrorClass: UnprocessableEntityError, status: 422, code: "UNPROCESSABLE_ENTITY", message: "Unprocessable entity" },
	{ name: "TooManyRequestsError", ErrorClass: TooManyRequestsError, status: 429, code: "TOO_MANY_REQUESTS", message: "Too many requests" },
	{ name: "InternalServerError", ErrorClass: InternalServerError, status: 500, code: "INTERNAL_SERVER_ERROR", message: "Internal server error" },
	{ name: "BadGatewayError", ErrorClass: BadGatewayError, status: 502, code: "BAD_GATEWAY", message: "Bad gateway" },
	{ name: "ServiceUnavailableError", ErrorClass: ServiceUnavailableError, status: 503, code: "SERVICE_UNAVAILABLE", message: "Service unavailable" },
];

describe("Erros da aplicação (AppError)", () => {
	describe.each(cases)("$name", ({ name, ErrorClass, status, code, message }) => {
		it(`usa status ${status}, código ${code} e mensagem padrão`, () => {
			const error = new ErrorClass();

			expect(error.statusCode).toBe(status);
			expect(error.code).toBe(code);
			expect(error.message).toBe(message);
		});

		it("aceita mensagem customizada e causa", () => {
			const cause = { motivo: "detalhe" };

			const error = new ErrorClass("mensagem customizada", cause);

			expect(error.message).toBe("mensagem customizada");
			expect(error.cause).toEqual(cause);
		});

		it("é um AppError/Error com name e stack próprios", () => {
			const error = new ErrorClass();

			expect(error).toBeInstanceOf(AppError);
			expect(error).toBeInstanceOf(Error);
			expect(error).toBeInstanceOf(ErrorClass);
			expect(error.name).toBe(name);
			expect(error.stack).toBeDefined();
		});
	});
});
