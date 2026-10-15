import { RefreshToken } from "@domain/entities/refresh-token.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const NOW = new Date("2026-06-15T12:00:00Z");

const baseProps = (expiresAt: Date) => ({
	id: "refresh-1",
	userId: "user-1",
	tokenHash: "hash-1",
	expiresAt,
});

describe("RefreshToken (Entity)", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(NOW);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it.each(["create", "restore"] as const)(
		"%s() expõe os dados informados",
		(factory) => {
			const expiresAt = new Date(NOW.getTime() + 60_000);

			const token = RefreshToken[factory](baseProps(expiresAt));

			expect(token.id).toBe("refresh-1");
			expect(token.userId).toBe("user-1");
			expect(token.tokenHash).toBe("hash-1");
			expect(token.expiresAt).toBe(expiresAt);
		},
	);

	describe("isExpired()", () => {
		it("é falso antes da expiração", () => {
			const token = RefreshToken.create(
				baseProps(new Date(NOW.getTime() + 1)),
			);

			expect(token.isExpired()).toBe(false);
		});

		it("é verdadeiro exatamente no instante de expiração", () => {
			const token = RefreshToken.create(baseProps(new Date(NOW.getTime())));

			expect(token.isExpired()).toBe(true);
		});

		it("é verdadeiro depois da expiração", () => {
			const token = RefreshToken.create(
				baseProps(new Date(NOW.getTime() - 1)),
			);

			expect(token.isExpired()).toBe(true);
		});

		it("acompanha o passar do tempo", () => {
			const token = RefreshToken.create(
				baseProps(new Date(NOW.getTime() + 5_000)),
			);
			expect(token.isExpired()).toBe(false);

			vi.advanceTimersByTime(5_000);

			expect(token.isExpired()).toBe(true);
		});
	});

	describe("refresh()", () => {
		it("troca hash e validade mantendo id e dono, e devolve a própria instância", () => {
			const token = RefreshToken.create(
				baseProps(new Date(NOW.getTime() - 1_000)),
			);
			const newExpiration = new Date(NOW.getTime() + 3_600_000);

			const result = token.refresh({
				tokenHash: "hash-2",
				expiresAt: newExpiration,
			});

			expect(result).toBe(token);
			expect(token.tokenHash).toBe("hash-2");
			expect(token.expiresAt).toBe(newExpiration);
			expect(token.id).toBe("refresh-1");
			expect(token.userId).toBe("user-1");
			expect(token.isExpired()).toBe(false);
		});
	});
});
