import { User } from "@domain/entities/user.js";
import { Email } from "@domain/object-values/email.js";
import { UnprocessableEntityError } from "@shared/errors/unprocessable-entity-error.js";
import { describe, expect, it } from "vitest";

const baseProps = () => ({
	id: "user-1",
	name: "Maria Silva",
	email: new Email("maria@empresa.com"),
	passwordHashed: "hash-da-senha",
	role: "manager" as const,
});

describe("User (Entity)", () => {
	describe("create()", () => {
		it("cria o usuário exigindo troca de senha no primeiro acesso (RF-BE-003/004)", () => {
			const user = User.create(baseProps());

			expect(user.isDefaultPassword).toBe(true);
			expect(user.deletedAt).toBeUndefined();
		});

		it("expõe os dados informados", () => {
			const props = baseProps();
			const user = User.create(props);

			expect(user.id).toBe("user-1");
			expect(user.name).toBe("Maria Silva");
			expect(user.email).toBe(props.email);
			expect(user.passwordHasher).toBe("hash-da-senha");
			expect(user.role).toBe("manager");
		});

		it("remove espaços nas pontas do nome", () => {
			const user = User.create({ ...baseProps(), name: "  Maria Silva  " });

			expect(user.name).toBe("Maria Silva");
		});

		it("aceita nome com exatamente 4 caracteres", () => {
			expect(() => User.create({ ...baseProps(), name: "Anna" })).not.toThrow();
		});

		it.each(["", "Ana", "  Al  "])(
			"rejeita nome com menos de 4 caracteres (%j)",
			(name) => {
				expect(() => User.create({ ...baseProps(), name })).toThrow(
					UnprocessableEntityError,
				);
				expect(() => User.create({ ...baseProps(), name })).toThrow(
					"Nome do usuario deve ter no minimo 4 caracteres",
				);
			},
		);
	});

	describe("caracteres do nome (barra HTML/caracteres especiais antes de chegar aos e-mails)", () => {
		it.each(["José da Silva", "João Álvares", "Ana Júlia 2", "ÀÉÎÕÜ Teste"])(
			"aceita letras (com acentos), números e espaços: %j",
			(name) => {
				expect(() => User.create({ ...baseProps(), name })).not.toThrow();
			},
		);

		it.each([
			"<script>alert(1)</script>",
			"Maria & Filho",
			"Ana-Maria",
			"Maria@Home",
			"Maria_Silva",
			"João (Chefe)",
			'Maria "Maju"',
		])("rejeita caracteres especiais: %j", (name) => {
			expect(() => User.create({ ...baseProps(), name })).toThrow(
				UnprocessableEntityError,
			);
			expect(() => User.create({ ...baseProps(), name })).toThrow(
				"O nome do usuário contém caracteres especiais inválidos",
			);
		});

		it("restore() também aplica a regra", () => {
			expect(() =>
				User.restore({
					...baseProps(),
					name: "<b>Maria</b>",
					isDefaultPassword: false,
				}),
			).toThrow(UnprocessableEntityError);
		});
	});

	describe("restore()", () => {
		it("reconstrói o estado persistido sem alterá-lo", () => {
			const deletedAt = new Date("2026-01-10T10:00:00Z");

			const user = User.restore({
				...baseProps(),
				isDefaultPassword: false,
				deletedAt,
			});

			expect(user.isDefaultPassword).toBe(false);
			expect(user.deletedAt).toBe(deletedAt);
		});

		it("continua validando o tamanho do nome", () => {
			expect(() =>
				User.restore({ ...baseProps(), name: "Al", isDefaultPassword: false }),
			).toThrow(UnprocessableEntityError);
		});
	});

	describe("passwordHasher", () => {
		it("permite substituir o hash da senha", () => {
			const user = User.create(baseProps());

			user.passwordHasher = "novo-hash";

			expect(user.passwordHasher).toBe("novo-hash");
		});
	});
});
