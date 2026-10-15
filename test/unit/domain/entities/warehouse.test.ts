import { Warehouse } from "@domain/entities/warehouse.js";
import { MeasurementLimits } from "@domain/object-values/measurement-limits.js";
import { UnprocessableEntityError } from "@shared/errors/unprocessable-entity-error.js";
import { describe, expect, it } from "vitest";

const baseProps = () => ({
	id: "warehouse-1",
	name: "Câmara fria 1",
	condition: "cold" as const,
	category: "food" as const,
	description: "Armazena laticínios",
});

const limits = () =>
	new MeasurementLimits({ min: 2, max: 8 }, { min: 30, max: 60 });

describe("Warehouse (Entity) — ambientes (RF-BE-011..014)", () => {
	describe("create()", () => {
		it("cria o ambiente inativo", () => {
			const warehouse = Warehouse.create(baseProps());

			expect(warehouse.status).toBe("inactive");
			expect(warehouse.id).toBe("warehouse-1");
			expect(warehouse.condition).toBe("cold");
			expect(warehouse.category).toBe("food");
			expect(warehouse.limits).toBeUndefined();
		});

		it("remove espaços nas pontas do nome e da descrição", () => {
			const warehouse = Warehouse.create({
				...baseProps(),
				name: "  Depósito A  ",
				description: "  Peças  ",
			});

			expect(warehouse.name).toBe("Depósito A");
			expect(warehouse.description).toBe("Peças");
		});

		it("usa a descrição padrão quando ela vem vazia", () => {
			const warehouse = Warehouse.create({ ...baseProps(), description: "" });

			expect(warehouse.description).toBe("No description");
		});

		it("aceita limites já na criação", () => {
			const warehouse = Warehouse.create({ ...baseProps(), limits: limits() });

			expect(warehouse.limits?.temperature).toEqual({ min: 2, max: 8 });
		});

		it.each(["", "abc", "  ab  "])(
			"rejeita nome com menos de 4 caracteres (%j)",
			(name) => {
				expect(() => Warehouse.create({ ...baseProps(), name })).toThrow(
					UnprocessableEntityError,
				);
				expect(() => Warehouse.create({ ...baseProps(), name })).toThrow(
					"Nome do armazém deve ter no minimo 4 caracteres",
				);
			},
		);
	});

	describe("activate() / deactivate()", () => {
		it("não ativa o monitoramento sem limites definidos (RF-BE-024)", () => {
			const warehouse = Warehouse.create(baseProps());

			expect(() => warehouse.activate()).toThrow(UnprocessableEntityError);
			expect(() => warehouse.activate()).toThrow(
				"Não é possível ativar o monitoramento sem definir os limites",
			);
			expect(warehouse.status).toBe("inactive");
		});

		it("ativa quando há limites definidos", () => {
			const warehouse = Warehouse.create({ ...baseProps(), limits: limits() });

			warehouse.activate();

			expect(warehouse.status).toBe("active");
		});

		it("desativa um ambiente ativo", () => {
			const warehouse = Warehouse.create({ ...baseProps(), limits: limits() });
			warehouse.activate();

			warehouse.deactivate();

			expect(warehouse.status).toBe("inactive");
		});

		it("desativar um ambiente sem limites é permitido", () => {
			const warehouse = Warehouse.create(baseProps());

			expect(() => warehouse.deactivate()).not.toThrow();
		});
	});

	describe("restore()", () => {
		it("reconstrói o estado persistido (inclui status ativo)", () => {
			const warehouse = Warehouse.restore({
				...baseProps(),
				status: "active",
				limits: limits(),
			});

			expect(warehouse.status).toBe("active");
			expect(warehouse.limits?.humidity).toEqual({ min: 30, max: 60 });
		});

		it("continua validando o nome", () => {
			expect(() =>
				Warehouse.restore({ ...baseProps(), name: "ab", status: "inactive" }),
			).toThrow(UnprocessableEntityError);
		});
	});
});
