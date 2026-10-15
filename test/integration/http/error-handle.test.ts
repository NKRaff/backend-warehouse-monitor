import { RegisterUserSchema } from "@presentation/validators/schemas/register-user.schema.js";
import { ForbiddenError } from "@shared/errors/forbidden-error.js";
import express from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { errorHandle } from "@infrastructure/http/express/middlewares/error-handle.js";

const app = express();
app.use(express.json());
app.get("/app-error", () => {
	throw new ForbiddenError("Sem acesso");
});
app.get("/zod-error", () => {
	RegisterUserSchema.parse({});
});
app.post("/json", (_req, res) => {
	res.json({ ok: true });
});
app.get("/boom", () => {
	throw new Error("detalhe interno secreto");
});
app.use(errorHandle);

describe("errorHandle (middleware) — formato único de erro da API", () => {
	beforeEach(() => {
		vi.spyOn(console, "error").mockImplementation(() => {});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("AppError => status e mensagem do próprio erro", async () => {
		const res = await request(app).get("/app-error");

		expect(res.status).toBe(403);
		expect(res.body).toEqual({ statusCode: 403, mensagem: "Sem acesso" });
	});

	it("ZodError => 400 com a lista de erros por campo", async () => {
		const res = await request(app).get("/zod-error");

		expect(res.status).toBe(400);
		expect(res.body.mensagem).toBe("Erro na validação do input");
		expect(res.body.erros).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ campo: "name", statusCode: 400 }),
				expect.objectContaining({ campo: "email", statusCode: 400 }),
				expect.objectContaining({ campo: "role", statusCode: 400 }),
			]),
		);
	});

	it("JSON malformado => 400 'JSON invalido'", async () => {
		const res = await request(app)
			.post("/json")
			.set("Content-Type", "application/json")
			.send("{ isto não é json");

		expect(res.status).toBe(400);
		expect(res.body).toEqual({ statusCode: 400, mensagem: "JSON invalido" });
	});

	it("erro desconhecido => 500 genérico, sem vazar detalhes, e loga o erro", async () => {
		const res = await request(app).get("/boom");

		expect(res.status).toBe(500);
		expect(res.body).toEqual({
			statusCode: 500,
			mensagem: "Erro interno do servidor",
		});
		expect(JSON.stringify(res.body)).not.toContain("secreto");
		expect(console.error).toHaveBeenCalledTimes(1);
	});
});
