import { Email } from "@domain/object-values/email.js";
import { UnprocessableEntityError } from "@shared/errors/unprocessable-entity-error.js";
import { describe, expect, it } from "vitest";

describe("Email (Value Object)", () => {
	describe("criação", () => {
		it("normaliza o endereço: remove espaços nas pontas e converte para minúsculas", () => {
			const email = new Email("  Maria.Silva@Empresa.COM ");

			expect(email.value).toBe("maria.silva@empresa.com");
		});

		it("nasce como não verificado", () => {
			expect(new Email("maria@empresa.com").isVerified).toBe(false);
		});

		it.each([
			"",
			"   ",
			"sem-arroba",
			"sem@ponto",
			"@empresa.com",
			"com espaço@empresa.com",
			"duas@@empresa.com",
		])("rejeita o formato inválido %j", (invalid) => {
			expect(() => new Email(invalid)).toThrow(UnprocessableEntityError);
			expect(() => new Email(invalid)).toThrow("Endereço de e-mail inválido");
		});
	});

	describe("verify()", () => {
		it("marca o e-mail como verificado", () => {
			const email = new Email("maria@empresa.com");

			email.verify();

			expect(email.isVerified).toBe(true);
		});

		it("é idempotente", () => {
			const email = new Email("maria@empresa.com");

			email.verify();
			email.verify();

			expect(email.isVerified).toBe(true);
		});

		it("não altera o valor do endereço", () => {
			const email = new Email("maria@empresa.com");

			email.verify();

			expect(email.value).toBe("maria@empresa.com");
		});
	});
});
