import { AppError } from "@shared/errors/app-error.js";
import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export function errorHandle(
	error: unknown,
	_req: Request,
	res: Response,
	_next: NextFunction,
) {
	if (isJsonParseError(error)) {
		return res.status(400).json({
			statusCode: 400,
			mensagem: "JSON invalido",
		});
	}

	if (error instanceof ZodError) {
		return res.status(400).json({
			mensagem: "Erro na validação do input",
			erros: error.issues.map((issue) => ({
				campo: issue.path.join("."),
				statusCode: 400,
				mensagem: issue.message,
			})),
		});
	}

	if (error instanceof AppError) {
		return res.status(error.statusCode).json({
			statusCode: error.statusCode,
			mensagem: error.message,
		});
	}

	console.error(error);

	return res.status(500).json({
		statusCode: 500,
		mensagem: "Erro interno do servidor",
	});
}

function isJsonParseError(
	error: unknown,
): error is { type: string; statusCode: number } {
	return (
		typeof error === "object" &&
		error !== null &&
		"type" in error &&
		(error as { type: unknown }).type === "entity parse.failed"
	);
}
