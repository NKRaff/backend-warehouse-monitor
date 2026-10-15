import { PasswordPolicyService } from "@application/services/password-policy.service.js";
import { UnprocessableEntityError } from "@shared/errors/unprocessable-entity-error.js";
import { beforeEach, describe, expect, it } from "vitest";
import { resetSingleton } from "../../../helpers/singleton.js";

describe("PasswordPolicyService — RF-BE-004", () => {
	let service: PasswordPolicyService;

	beforeEach(() => {
		resetSingleton(PasswordPolicyService);
		service = PasswordPolicyService.instance();
	});

	it("aceita uma senha que cumpre todos os critérios", () => {
		expect(service.isValid("Senha@123", "Senha@123")).toBe(true);
	});

	it.each([
		["tem menos de 8 caracteres", "Ab1@", "no minimo 8 caracteres"],
		["não tem letra maiúscula", "senha@123", "caractere maiusculo"],
		["não tem letra minúscula", "SENHA@123", "caractere minusculo"],
		["não tem número", "Senha@abc", "caractere numerico"],
		["não tem caractere especial", "Senha1234", "caractere especiais"],
	])("rejeita a senha que %s", (_motivo, password, trecho) => {
		expect(() => service.isValid(password, password)).toThrow(
			UnprocessableEntityError,
		);
		expect(() => service.isValid(password, password)).toThrow(trecho);
	});

	it("rejeita quando a confirmação é diferente da senha", () => {
		expect(() => service.isValid("Senha@123", "Outra@123")).toThrow(
			/senhas não coincidem/,
		);
	});

	it("reporta todos os critérios violados de uma só vez", () => {
		expect(() => service.isValid("abc", "abc")).toThrow(
			/Senha invalida: .*8 caracteres.*maiusculo.*numerico.*especiais/,
		);
	});

	it("reporta divergência e fraqueza juntas", () => {
		expect(() => service.isValid("abc", "xyz")).toThrow(
			/não coincidem.*8 caracteres/,
		);
	});

	it("espaços não contam como caractere especial", () => {
		expect(() => service.isValid("Senha 1234", "Senha 1234")).toThrow(
			/caractere especiais/,
		);
	});

	it("é um Singleton", () => {
		expect(PasswordPolicyService.instance()).toBe(service);
	});
});
