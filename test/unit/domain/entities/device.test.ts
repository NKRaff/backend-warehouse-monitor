import { Device } from "@domain/entities/device.js";
import { UnprocessableEntityError } from "@shared/errors/unprocessable-entity-error.js";
import { describe, expect, it } from "vitest";

const baseProps = () => ({
	mac: "AA:BB:CC:DD:EE:FF",
	name: "Sensor câmara 1",
	warehouseId: "0190f1a0-7b00-7000-8000-000000000001",
	lastMeasurementId: "measurement-0",
	deviceStatus: "online" as const,
	monitoringStatus: "enabled" as const,
});

describe("Device (Entity)", () => {
	describe("create()", () => {
		it("expõe os dados informados", () => {
			const device = Device.create({
				mac: "AA:BB:CC:DD:EE:FF",
				name: "Sensor câmara 1",
				warehouseId: "0190f1a0-7b00-7000-8000-000000000001",
			});

			expect(device.mac).toBe("AA:BB:CC:DD:EE:FF");
			expect(device.name).toBe("Sensor câmara 1");
			expect(device.warehouseId).toBe("0190f1a0-7b00-7000-8000-000000000001");
			expect(device.lastMeasurementId).toBeUndefined();
			expect(device.deviceStatus).toBe("online");
			expect(device.monitoringStatus).toBe("disabled");
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

		it("rejeita MAC inválido", () => {
			expect(() => Device.create({ mac: "mac-inválido", name: "Sensor válido" })).toThrow(
				"Endereço mac invalido",
			);
		});

		it("rejeita UUID de armazém que não seja v7", () => {
			expect(
				() =>
					Device.create({
						mac: "AA:BB:CC:DD:EE:FF",
						name: "Sensor válido",
						warehouseId: "0190f1a0-7b00-6000-8000-000000000001",
					}),
			).toThrow("Id de ambiente invalido");
		});
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
			device.enableMonitoring();

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

	describe("atualização de propriedades", () => {
		it("normaliza o nome ao atualizá-lo", () => {
			const device = Device.create({ mac: baseProps().mac, name: "Sensor antigo" });

			device.name = "  Sensor novo  ";

			expect(device.name).toBe("Sensor novo");
		});

		it("rejeita nome curto após trim", () => {
			const device = Device.create({ mac: baseProps().mac, name: "Sensor antigo" });

			expect(() => {
				device.name = "  a ";
			}).toThrow("Nome do dispositivo deve ter no minimo 4 caracteres");
		});

		it("normaliza UUID v7 de armazém e última medição", () => {
			const device = Device.create({ mac: baseProps().mac, name: "Sensor antigo" });

			device.warehouseId = "  0190f1a0-7b00-7000-8000-000000000001  ";
			device.lastMeasurementId =
				"  0190f1a0-7b00-7000-8000-000000000002  ";

			expect(device.warehouseId).toBe("0190f1a0-7b00-7000-8000-000000000001");
			expect(device.lastMeasurementId).toBe("0190f1a0-7b00-7000-8000-000000000002");
		});

		it.each(["warehouse-inválido", "measurement-inválida"])(
			"rejeita UUID inválido ao atualizar vínculo ou medição (%s)",
			(id) => {
				const device = Device.create({ mac: baseProps().mac, name: "Sensor antigo" });

				expect(() => {
					device.warehouseId = id;
				}).toThrow(UnprocessableEntityError);
				expect(() => {
					device.lastMeasurementId = id;
				}).toThrow(UnprocessableEntityError);
			},
		);

		it("atualiza os status da entidade", () => {
			const device = Device.create({ mac: baseProps().mac, name: "Sensor antigo" });

			device.deviceStatus = "error";
			device.monitoringStatus = "enabled";

			expect(device.deviceStatus).toBe("error");
			expect(device.monitoringStatus).toBe("enabled");
		});
	});
});
