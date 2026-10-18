import { ChangeRoleUseCase } from "@application/use-cases/change-role.use-case.js";
import { NotFoundError } from "@shared/errors/not-found-error.js";
import { beforeEach, describe, expect, it } from "vitest";
import { makeUser } from "../../../helpers/factories.js";
import { createAuditLogRepoMock, createUserRepoMock, createUuidProviderMock } from "../../../helpers/mocks.js";
import { resetSingleton } from "../../../helpers/singleton.js";

describe("ChangeRoleUseCase — RF-BE-009", () => {
	beforeEach(() => resetSingleton(ChangeRoleUseCase));
	it("altera o papel e registra ator e mudança na auditoria", async () => {
		const users = createUserRepoMock();
		const audit = createAuditLogRepoMock();
		const useCase = ChangeRoleUseCase.instance(createUuidProviderMock(), users, audit);
		users.findById.mockResolvedValue(makeUser({ id: "user-2", role: "operator" }));
		await useCase.execute({ userId: "user-2", role: "manager", actorId: "admin-1" });
		expect(users.updateRole).toHaveBeenCalledWith("user-2", "manager");
		expect(audit.save).toHaveBeenCalledWith(expect.objectContaining({ actorId: "admin-1", metadata: { old: "operator", new: "manager" } }));
	});
	it("rejeita usuário inexistente", async () => {
		const users = createUserRepoMock();
		const useCase = ChangeRoleUseCase.instance(createUuidProviderMock(), users, createAuditLogRepoMock());
		await expect(useCase.execute({ userId: "missing", role: "manager", actorId: "admin-1" })).rejects.toThrow(NotFoundError);
	});
});
