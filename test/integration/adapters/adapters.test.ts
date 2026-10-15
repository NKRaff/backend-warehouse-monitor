import { UnauthorizedError } from "@shared/errors/unauthorized-error.js";
import jwt from "jsonwebtoken";
import { describe, expect, it } from "vitest";
import { BcryptPasswordHasherAdapter } from "@infrastructure/cryptography/bcrypt-password-hasher.adapter.js";
import { JwtTokenAdapter } from "@infrastructure/cryptography/jwt-token.adapter.js";
import { env } from "@infrastructure/config/env.js";
import { UuidAdapter } from "@infrastructure/identifier/uuid.adapter.js";

const nowInSeconds = () => Math.floor(Date.now() / 1000);

describe("BcryptPasswordHasherAdapter", () => {
	const hasher = BcryptPasswordHasherAdapter.instance();

	it("gera um hash bcrypt diferente do valor original", async () => {
		const hash = await hasher.hash("Senha@123");

		expect(hash).not.toBe("Senha@123");
		expect(hash).toMatch(/^\$2[aby]\$/);
	});

	it("gera hashes distintos para o mesmo valor (salt aleatório)", async () => {
		const [a, b] = await Promise.all([
			hasher.hash("Senha@123"),
			hasher.hash("Senha@123"),
		]);

		expect(a).not.toBe(b);
	});

	it("compare() confirma a senha correta e recusa a incorreta", async () => {
		const hash = await hasher.hash("Senha@123");

		await expect(hasher.compare("Senha@123", hash)).resolves.toBe(true);
		await expect(hasher.compare("senha@123", hash)).resolves.toBe(false);
	});

	it("é um Singleton", () => {
		expect(BcryptPasswordHasherAdapter.instance()).toBe(hasher);
	});
});

describe("JwtTokenAdapter — RF-BE-006", () => {
	const adapter = JwtTokenAdapter.instance();

	it("assina e verifica um token devolvendo o `sub`", () => {
		const token = adapter.sign({ sub: "user-1" });

		const payload = adapter.verify(token);

		expect(payload.sub).toBe("user-1");
	});

	it("o token expira conforme JWT_EXPIRES_IN_MIN", () => {
		const token = adapter.sign({ sub: "user-1" });

		const { iat, exp } = jwt.decode(token) as jwt.JwtPayload;

		expect((exp ?? 0) - (iat ?? 0)).toBe(env.jwt.expiresInMs / 1000);
	});

	it("rejeita token expirado com mensagem específica", () => {
		const expired = jwt.sign(
			{ sub: "user-1", exp: nowInSeconds() - 60 },
			env.jwt.secret,
		);

		expect(() => adapter.verify(expired)).toThrow(UnauthorizedError);
		expect(() => adapter.verify(expired)).toThrow("Token de acesso expirado");
	});

	it("rejeita token que ainda não é válido (nbf no futuro)", () => {
		const early = jwt.sign(
			{ sub: "user-1", nbf: nowInSeconds() + 3600 },
			env.jwt.secret,
		);

		expect(() => adapter.verify(early)).toThrow(
			"Token de acesso ainda não está ativo",
		);
	});

	it("rejeita token assinado com outro segredo (assinatura adulterada)", () => {
		const forged = jwt.sign({ sub: "user-1" }, "outro-segredo-qualquer");

		expect(() => adapter.verify(forged)).toThrow(UnauthorizedError);
		expect(() => adapter.verify(forged)).toThrow("Token de acesso inválido");
	});

	it.each(["", "não-é-um-jwt", "a.b.c"])(
		"rejeita token malformado (%j)",
		(garbage) => {
			expect(() => adapter.verify(garbage)).toThrow("Token de acesso inválido");
		},
	);

	it("é um Singleton", () => {
		expect(JwtTokenAdapter.instance()).toBe(adapter);
	});
});

describe("UuidAdapter", () => {
	const adapter = UuidAdapter.instance();

	it("gera UUID v7 válido", () => {
		expect(adapter.generate()).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
		);
	});

	it("gera ids únicos e ordenáveis no tempo", () => {
		const ids = Array.from({ length: 50 }, () => adapter.generate());

		expect(new Set(ids).size).toBe(50);
		expect([...ids].sort()).toEqual(ids);
	});

	it("é um Singleton", () => {
		expect(UuidAdapter.instance()).toBe(adapter);
	});
});
