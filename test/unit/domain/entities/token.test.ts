import { createHash } from "node:crypto";
import { Token } from "@domain/entities/token.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const NOW = new Date("2026-06-15T12:00:00Z");

describe("Token (Entity)", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(NOW);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it.each(["password_reset", "refresh"] as const)(
		"cria token do tipo %s com identificador, usuário e validade de 15 minutos",
		(type) => {
			const token =
				type === "password_reset"
					? Token.createPasswordReset("token-1", "user-1")
					: Token.createRefreshToken("token-1", "user-1");

			expect(token.id).toBe("token-1");
			expect(token.userId).toBe("user-1");
			expect(token.type).toBe(type);
			expect(token.expiresAt).toEqual(new Date(NOW.getTime() + 15 * 60_000));
		});

	it("restore() reconstrói os dados persistidos", () => {
		const expiresAt = new Date(NOW.getTime() + 60_000);
		const token = Token.restore({
			id: "token-1",
			userId: "user-1",
			type: "password_reset",
			value: "value-hash",
			expiresAt,
		});

		expect(token.id).toBe("token-1");
		expect(token.userId).toBe("user-1");
		expect(token.value).toBe("value-hash");
		expect(token.expiresAt).toBe(expiresAt);
	});

	it("hash() produz SHA-256 e verify() aceita só o valor original", () => {
		const token = Token.createPasswordReset("token-1", "user-1");
		const plainToken = token.value;
		const hash = token.hash();

		expect(hash).toBe(createHash("sha256").update(plainToken).digest("hex"));
		token.value = hash;
		expect(token.verify(plainToken)).toBe(true);
		expect(token.verify("token-adulterado")).toBe(false);
	});

	it("isExpired() só é verdadeiro depois do instante de expiração", () => {
		const token = Token.restore({
			id: "token-1",
			userId: "user-1",
			type: "refresh",
			value: "hash",
			expiresAt: new Date(NOW.getTime() + 5_000),
		});

		expect(token.isExpired()).toBe(false);
		vi.advanceTimersByTime(5_000);
		expect(token.isExpired()).toBe(false);
		vi.advanceTimersByTime(1);
		expect(token.isExpired()).toBe(true);
	});

	it("refresh() troca o valor e renova a validade por 15 minutos", () => {
		const token = Token.createRefreshToken("token-1", "user-1");
		const previousValue = token.value;
		vi.advanceTimersByTime(20 * 60_000);

		token.refresh();

		expect(token.value).not.toBe(previousValue);
		expect(token.expiresAt).toEqual(new Date(Date.now() + 15 * 60_000));
		expect(token.isExpired()).toBe(false);
	});
});
