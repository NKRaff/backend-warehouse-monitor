import { DeleteWarehouseUseCase } from "@application/use-cases/delete-warehouse.use-case.js";
import { beforeEach, describe, expect, it } from "vitest";
import {
	createAuditLogRepoMock,
	createDeviceRepoMock,
	createUuidProviderMock,
	createWarehouseRepoMock,
} from "../../../helpers/mocks.js";
import { resetSingleton } from "../../../helpers/singleton.js";

describe("DeleteWarehouseUseCase — RF-BE-013", () => {
	beforeEach(() => resetSingleton(DeleteWarehouseUseCase));

	it("reutiliza a instância configurada primeiro", async () => {
		const firstWarehouses = createWarehouseRepoMock();
		const firstAudit = createAuditLogRepoMock();
		const firstDevices = createDeviceRepoMock();
		const first = DeleteWarehouseUseCase.instance(
			createUuidProviderMock(),
			firstWarehouses,
			firstAudit,
			firstDevices,
		);
		const ignoredWarehouses = createWarehouseRepoMock();
		const ignoredAudit = createAuditLogRepoMock();
		const ignoredDevices = createDeviceRepoMock();
		const second = DeleteWarehouseUseCase.instance(
			createUuidProviderMock(),
			ignoredWarehouses,
			ignoredAudit,
			ignoredDevices,
		);

		expect(second).toBe(first);
		await second.execute({ warehouseId: "warehouse-1", actorId: "manager-1" });

		expect(firstWarehouses.deletedById).toHaveBeenCalledExactlyOnceWith(
			"warehouse-1",
		);
		expect(ignoredWarehouses.deletedById).not.toHaveBeenCalled();
		expect(ignoredAudit.save).not.toHaveBeenCalled();
		expect(firstDevices.unlinkWarehouse).toHaveBeenCalledExactlyOnceWith("warehouse-1");
		expect(ignoredDevices.unlinkWarehouse).not.toHaveBeenCalled();
	});

	it("marca o armazém como removido e registra auditoria com o ator", async () => {
		const warehouses = createWarehouseRepoMock();
		const audit = createAuditLogRepoMock();
		const devices = createDeviceRepoMock();
		const useCase = DeleteWarehouseUseCase.instance(
			createUuidProviderMock(),
			warehouses,
			audit,
			devices,
		);

		await expect(
			useCase.execute({ warehouseId: "warehouse-1", actorId: "manager-1" }),
		).resolves.toEqual({ message: "Armazém excluido com sucesso" });

		expect(warehouses.deletedById).toHaveBeenCalledExactlyOnceWith(
			"warehouse-1",
		);
		expect(devices.unlinkWarehouse).toHaveBeenCalledExactlyOnceWith("warehouse-1");
		expect(devices.unlinkWarehouse.mock.invocationCallOrder[0]).toBeLessThan(
			warehouses.deletedById.mock.invocationCallOrder[0],
		);
		expect(audit.save).toHaveBeenCalledWith(
			expect.objectContaining({
				id: "uuid-1",
				action: "delete",
				actorId: "manager-1",
				resourceId: "warehouse-1",
				resourceType: "warehouse",
			}),
		);
	});

	it("não registra auditoria se a remoção no repositório falhar", async () => {
		const warehouses = createWarehouseRepoMock();
		warehouses.deletedById.mockRejectedValue(new Error("falha ao gravar"));
		const audit = createAuditLogRepoMock();
		const devices = createDeviceRepoMock();
		const useCase = DeleteWarehouseUseCase.instance(
			createUuidProviderMock(),
			warehouses,
			audit,
			devices,
		);

		await expect(
			useCase.execute({ warehouseId: "warehouse-1", actorId: "manager-1" }),
		).rejects.toThrow("falha ao gravar");
		expect(audit.save).not.toHaveBeenCalled();
	});

	it("propaga falha ao registrar auditoria após solicitar a remoção", async () => {
		const warehouses = createWarehouseRepoMock();
		const audit = createAuditLogRepoMock();
		const devices = createDeviceRepoMock();
		audit.save.mockRejectedValue(new Error("falha na auditoria"));
		const useCase = DeleteWarehouseUseCase.instance(
			createUuidProviderMock(),
			warehouses,
			audit,
			devices,
		);

		await expect(
			useCase.execute({ warehouseId: "warehouse-1", actorId: "manager-1" }),
		).rejects.toThrow("falha na auditoria");
		expect(warehouses.deletedById).toHaveBeenCalledExactlyOnceWith(
			"warehouse-1",
		);
	});
});
