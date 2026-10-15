import { Alert } from "@domain/entities/alert.js";
import { ConflictError } from "@shared/errors/conflict-error.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const baseProps = () => ({
	id: "alert-1",
	type: "measurement_out_of_limits" as const,
	severity: "critical" as const,
	title: "Temperatura acima do limite",
	description: "Câmara fria 1 registrou 12°C",
	occurredAt: new Date("2026-03-01T08:00:00Z"),
});

describe("Alert (Entity)", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-06-15T12:00:00Z"));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe("create()", () => {
		it("cria o alerta com status ativo e sem dados de resolução (RF-BE-025)", () => {
			const alert = Alert.create(baseProps());

			expect(alert.status).toBe("active");
			expect(alert.resolvedAt).toBeUndefined();
			expect(alert.resolvedById).toBeUndefined();
		});

		it("mantém os dados informados", () => {
			const alert = Alert.create(baseProps());

			expect(alert.id).toBe("alert-1");
			expect(alert.type).toBe("measurement_out_of_limits");
			expect(alert.severity).toBe("critical");
			expect(alert.occurredAt).toEqual(new Date("2026-03-01T08:00:00Z"));
		});

		it("remove espaços nas pontas do título e da descrição", () => {
			const alert = Alert.create({
				...baseProps(),
				title: "  Título  ",
				description: "\n Descrição \n",
			});

			expect(alert.title).toBe("Título");
			expect(alert.description).toBe("Descrição");
		});

		it("usa a data/hora atual quando occurredAt não é informado", () => {
			const alert = Alert.create({
				...baseProps(),
				occurredAt: undefined as unknown as Date,
			});

			expect(alert.occurredAt).toEqual(new Date("2026-06-15T12:00:00Z"));
		});
	});

	describe("resolve() — RF-BE-029", () => {
		it("marca como resolvido registrando quem resolveu e quando", () => {
			const alert = Alert.create(baseProps());
			const resolvedAt = new Date("2026-06-15T13:30:00Z");

			alert.resolve("user-9", resolvedAt);

			expect(alert.status).toBe("resolved");
			expect(alert.resolvedById).toBe("user-9");
			expect(alert.resolvedAt).toBe(resolvedAt);
		});

		it("rejeita resolver um alerta que já foi resolvido", () => {
			const alert = Alert.create(baseProps());
			alert.resolve("user-9", new Date());

			expect(() => alert.resolve("user-10", new Date())).toThrow(ConflictError);
			expect(() => alert.resolve("user-10", new Date())).toThrow(
				"O alerta ja foi resolvido",
			);
		});

		it("não sobrescreve os dados da primeira resolução", () => {
			const alert = Alert.create(baseProps());
			const firstResolution = new Date("2026-06-15T13:30:00Z");
			alert.resolve("user-9", firstResolution);

			expect(() => alert.resolve("user-10", new Date())).toThrow();

			expect(alert.resolvedById).toBe("user-9");
			expect(alert.resolvedAt).toBe(firstResolution);
		});
	});

	describe("restore()", () => {
		it("reconstrói um alerta já resolvido", () => {
			const resolvedAt = new Date("2026-06-15T13:30:00Z");

			const alert = Alert.restore({
				...baseProps(),
				status: "resolved",
				resolvedAt,
				resolvedById: "user-9",
			});

			expect(alert.status).toBe("resolved");
			expect(alert.resolvedAt).toBe(resolvedAt);
			expect(alert.resolvedById).toBe("user-9");
			expect(() => alert.resolve("user-1", new Date())).toThrow(ConflictError);
		});
	});
});
