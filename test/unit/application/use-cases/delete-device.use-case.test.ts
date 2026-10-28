import { DeleteDeviceUseCase } from "@application/use-cases/delete-device.use-case.js";
import { Device } from "@domain/entities/device.js";
import { NotFoundError } from "@shared/errors/not-found-error.js";
import { beforeEach, describe, expect, it } from "vitest";
import {
	createAuditLogRepoMock,
	createDeviceRepoMock,
	createMqttClientMock,
	createUuidProviderMock,
} from "../../../helpers/mocks.js";
import { resetSingleton } from "../../../helpers/singleton.js";

describe("DeleteDeviceUseCase — RF-BE-017", () => {
	const deviceId = "AA:BB:CC:DD:EE:30";
	let deviceRepo: ReturnType<typeof createDeviceRepoMock>;
	let mqttClient: ReturnType<typeof createMqttClientMock>;
	let auditLogRepo: ReturnType<typeof createAuditLogRepoMock>;
	let uuidProvider: ReturnType<typeof createUuidProviderMock>;
	let useCase: DeleteDeviceUseCase;

	beforeEach(() => {
		resetSingleton(DeleteDeviceUseCase);
		deviceRepo = createDeviceRepoMock();
		mqttClient = createMqttClientMock();
		auditLogRepo = createAuditLogRepoMock();
		uuidProvider = createUuidProviderMock();
		useCase = DeleteDeviceUseCase.instance(
			uuidProvider,
			mqttClient,
			deviceRepo,
			auditLogRepo,
		);
	});

	it("registra auditoria, cancela o tópico MQTT e exclui pelo MAC", async () => {
		deviceRepo.findById.mockResolvedValue(
			Device.create({ mac: deviceId, name: "Sensor câmara" }),
		);

		await expect(
			useCase.execute({ actorId: "manager-1", deviceId }),
		).resolves.toEqual({ message: "Dispositivo excluido com sucesso" });

		expect(auditLogRepo.save).toHaveBeenCalledWith(
			expect.objectContaining({
				action: "delete",
				actorId: "manager-1",
				id: "uuid-1",
				resourceId: deviceId,
				resourceType: "device",
			}),
		);
		expect(mqttClient.unsubscribe).toHaveBeenCalledWith(`device/${deviceId}/*`);
		expect(deviceRepo.deleteById).toHaveBeenCalledWith(deviceId);
		expect(auditLogRepo.save.mock.invocationCallOrder[0]).toBeLessThan(
			mqttClient.unsubscribe.mock.invocationCallOrder[0],
		);
		expect(mqttClient.unsubscribe.mock.invocationCallOrder[0]).toBeLessThan(
			deviceRepo.deleteById.mock.invocationCallOrder[0],
		);
	});

	it("retorna 404 e não executa efeitos quando o dispositivo não existe", async () => {
		await expect(
			useCase.execute({ actorId: "manager-1", deviceId }),
		).rejects.toBeInstanceOf(NotFoundError);

		expect(auditLogRepo.save).not.toHaveBeenCalled();
		expect(mqttClient.unsubscribe).not.toHaveBeenCalled();
		expect(deviceRepo.deleteById).not.toHaveBeenCalled();
	});

	it("interrompe a exclusão se não conseguir registrar a auditoria", async () => {
		deviceRepo.findById.mockResolvedValue(
			Device.create({ mac: deviceId, name: "Sensor câmara" }),
		);
		auditLogRepo.save.mockRejectedValue(new Error("Mongo indisponível"));

		await expect(
			useCase.execute({ actorId: "manager-1", deviceId }),
		).rejects.toThrow("Mongo indisponível");

		expect(mqttClient.unsubscribe).not.toHaveBeenCalled();
		expect(deviceRepo.deleteById).not.toHaveBeenCalled();
	});

	it("propaga falha MQTT e não exclui o dispositivo", async () => {
		deviceRepo.findById.mockResolvedValue(
			Device.create({ mac: deviceId, name: "Sensor câmara" }),
		);
		mqttClient.unsubscribe.mockRejectedValue(new Error("Broker indisponível"));

		await expect(
			useCase.execute({ actorId: "manager-1", deviceId }),
		).rejects.toThrow("Broker indisponível");

		expect(auditLogRepo.save).toHaveBeenCalledOnce();
		expect(deviceRepo.deleteById).not.toHaveBeenCalled();
	});

	it("propaga falha do repositório após cancelar o tópico", async () => {
		deviceRepo.findById.mockResolvedValue(
			Device.create({ mac: deviceId, name: "Sensor câmara" }),
		);
		deviceRepo.deleteById.mockRejectedValue(new Error("Falha ao excluir"));

		await expect(
			useCase.execute({ actorId: "manager-1", deviceId }),
		).rejects.toThrow("Falha ao excluir");

		expect(mqttClient.unsubscribe).toHaveBeenCalledWith(`device/${deviceId}/*`);
	});

	it("reutiliza a instância singleton criada primeiro", () => {
		const otherRepo = createDeviceRepoMock();

		expect(
			DeleteDeviceUseCase.instance(
				createUuidProviderMock("other"),
				createMqttClientMock(),
				otherRepo,
				createAuditLogRepoMock(),
			),
		).toBe(useCase);
	});
});
