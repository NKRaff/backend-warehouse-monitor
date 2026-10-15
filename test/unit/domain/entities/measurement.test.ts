import { Measurement } from "@domain/entities/measurement.js";
import { describe, expect, it } from "vitest";

const props = {
	id: "measurement-1",
	deviceId: "AA:BB:CC:DD:EE:FF",
	warehouseId: "warehouse-1",
	type: "temperature" as const,
	value: 4.5,
	createdAt: new Date("2026-03-01T08:00:00Z"),
};

describe("Measurement (Entity) — RF-BE-021", () => {
	it.each(["create", "restore"] as const)(
		"%s() expõe os dados da leitura",
		(factory) => {
			const measurement = Measurement[factory](props);

			expect(measurement.id).toBe("measurement-1");
			expect(measurement.deviceId).toBe("AA:BB:CC:DD:EE:FF");
			expect(measurement.warehouseId).toBe("warehouse-1");
			expect(measurement.type).toBe("temperature");
			expect(measurement.value).toBe(4.5);
			expect(measurement.createdAt).toEqual(new Date("2026-03-01T08:00:00Z"));
		},
	);

	it("aceita leituras de umidade", () => {
		const measurement = Measurement.create({
			...props,
			type: "humidity",
			value: 55,
		});

		expect(measurement.type).toBe("humidity");
		expect(measurement.value).toBe(55);
	});
});
