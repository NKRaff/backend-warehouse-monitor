import { Device } from "@domain/entities/device.js";
import { UnprocessableEntityError } from "@shared/errors/unprocessable-entity-error.js";
import { describe, expect, it } from "vitest";

const baseProps = () => ({
	mac: "AA:BB:CC:DD:EE:FF",
	name: "Sensor câmara 1",
	warehouseId: "warehouse-1",
	lastMeasurementId: "measurement-0",
	deviceStatus: "online" as const,
	monitoringStatus: "enabled" as const,
});

describe("Device (Entity)", () => {
	describe("create()", () => {
		it("expõe os dados informados", () => {
			const device = Device.create(baseProps());

			expect(device.mac).toBe("AA:BB:CC:DD:EE:FF");
			expect(device.name).toBe("Sensor câmara 1");
			expect(device.warehouseId).toBe("warehouse-1");
			expect(device.lastMeasurementId).toBe("measurement-0");
			expect(device.deviceStatus).toBe("online");
			expect(device.monitoringStatus).toBe("enabled");
		});

		it("remove espaços nas pontas do nome", () => {
			const device = Device.create({ ...baseProps(), name: "  Sensor 1  " });

			expect(device.name).toBe("Sensor 1");
		});

		it.each(["", "abc", "  ab  "])(
			"rejeita nome com menos de 4 caracteres (%j)",
			(name) => {
				expect(() => Device.create({ ...baseProps(), name })).toThrow(
					UnprocessableEntityError,
				);
				expect(() => Device.create({ ...baseProps(), name })).toThrow(
					"Nome do dispositivo deve ter no minimo 4 caracteres",
				);
			},
		);
	});

	describe("restore()", () => {
		it("reconstrói o estado persistido sem revalidar o nome", () => {
			const device = Device.restore({ ...baseProps(), name: "ab" });

			expect(device.name).toBe("ab");
		});
	});

	describe("monitoramento", () => {
		it("disableMonitoring() / enableMonitoring() alternam o estado", () => {
			const device = Device.create(baseProps());

			device.disableMonitoring();
			expect(device.monitoringStatus).toBe("disabled");

			device.enableMonitoring();
			expect(device.monitoringStatus).toBe("enabled");
		});

		it("updateMeasurement() guarda a última medição quando o monitoramento está ativo", () => {
			const device = Device.create(baseProps());

			device.updateMeasurement("measurement-42");

			expect(device.lastMeasurementId).toBe("measurement-42");
		});

		it("updateMeasurement() é ignorado quando o monitoramento está desativado", () => {
			const device = Device.create({
				...baseProps(),
				monitoringStatus: "disabled",
			});

			device.updateMeasurement("measurement-42");

			expect(device.lastMeasurementId).toBe("measurement-0");
		});
	});
});
