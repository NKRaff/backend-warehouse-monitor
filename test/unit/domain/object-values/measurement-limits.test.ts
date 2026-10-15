import { MeasurementLimits } from "@domain/object-values/measurement-limits.js";
import { UnprocessableEntityError } from "@shared/errors/unprocessable-entity-error.js";
import { describe, expect, it } from "vitest";

const range = (min: number, max: number) => ({ min, max });

describe("MeasurementLimits (Value Object) — RF-BE-024", () => {
	it("expõe os limites de temperatura e umidade informados", () => {
		const limits = new MeasurementLimits(range(2, 8), range(30, 60));

		expect(limits.temperature).toEqual({ min: 2, max: 8 });
		expect(limits.humidity).toEqual({ min: 30, max: 60 });
	});

	it("aceita temperaturas negativas (câmara fria / congelada)", () => {
		expect(
			() => new MeasurementLimits(range(-25, -15), range(30, 60)),
		).not.toThrow();
	});

	describe("temperatura", () => {
		it.each([
			[10, 10],
			[30, 10],
		])("rejeita mínimo (%i) maior ou igual ao máximo (%i)", (min, max) => {
			expect(
				() => new MeasurementLimits(range(min, max), range(30, 60)),
			).toThrow(UnprocessableEntityError);
		});
	});

	describe("umidade", () => {
		it.each([
			[60, 60],
			[80, 20],
		])("rejeita mínimo (%i) maior ou igual ao máximo (%i)", (min, max) => {
			expect(
				() => new MeasurementLimits(range(2, 8), range(min, max)),
			).toThrow(UnprocessableEntityError);
		});

		it.each([
			[-1, 50],
			[101, 102],
		])("rejeita mínimo fora de 0–100 (%i, %i)", (min, max) => {
			expect(
				() => new MeasurementLimits(range(2, 8), range(min, max)),
			).toThrow("O valor minimo de umidade deve estar entre 0 e 100");
		});

		it.each([
			[10, 101],
			[0, 150],
		])("rejeita máximo fora de 0–100 (%i, %i)", (min, max) => {
			expect(
				() => new MeasurementLimits(range(2, 8), range(min, max)),
			).toThrow("O valor maximo de umidade deve estar entre 0 e 100");
		});

		it("aceita 0% e 100% (limites inclusivos)", () => {
			expect(
				() => new MeasurementLimits(range(2, 8), range(0, 100)),
			).not.toThrow();
		});
	});
});
