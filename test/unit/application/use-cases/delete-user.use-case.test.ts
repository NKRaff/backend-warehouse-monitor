import { DeleteUserUseCase } from "@application/use-cases/delete-user.use-case.js";
import { NotFoundError } from "@shared/errors/not-found-error.js";
import { UnprocessableEntityError } from "@shared/errors/unprocessable-entity-error.js";
import { beforeEach, describe, expect, it } from "vitest";
import { makeUser } from "../../../helpers/factories.js";
import { createAuditLogRepoMock, createTokenRepoMock, createUserRepoMock, createUuidProviderMock } from "../../../helpers/mocks.js";
import { resetSingleton } from "../../../helpers/singleton.js";

describe("DeleteUserUseCase — RF-BE-008", () => {
	beforeEach(() => resetSingleton(DeleteUserUseCase));
	function setup() {
		const users = createUserRepoMock();
		const audit = createAuditLogRepoMock();
		const tokens = createTokenRepoMock();
		const useCase = DeleteUserUseCase.instance(createUuidProviderMock(), users, audit, tokens);
		return { useCase, users, audit, tokens };
	}
	it("remove usuário, audita a ação e invalida todos os tokens", async () => {
		const { useCase, users, audit, tokens } = setup();
		users.findById.mockResolvedValue(makeUser({ id: "user-2", role: "operator" }));
		await useCase.execute({ userId: "user-2", actorId: "admin-1" });
		expect(users.deleteById).toHaveBeenCalledWith("user-2");
		expect(audit.save).toHaveBeenCalledWith(expect.objectContaining({ action: "delete", actorId: "admin-1", resourceId: "user-2" }));
		expect(tokens.deleteAllByUser).toHaveBeenCalledWith("user-2");
	});
	it("rejeita usuário inexistente", async () => {
		const { useCase } = setup();
		await expect(useCase.execute({ userId: "missing", actorId: "admin-1" })).rejects.toThrow(NotFoundError);
	});
	it("preserva o único administrador ativo", async () => {
		const { useCase, users, audit, tokens } = setup();
		users.findById.mockResolvedValue(makeUser({ id: "admin-1", role: "administrator" }));
		users.findByRole.mockResolvedValue([makeUser({ id: "admin-1", role: "administrator" })]);
		await expect(useCase.execute({ userId: "admin-1", actorId: "admin-1" })).rejects.toThrow(UnprocessableEntityError);
		expect(users.deleteById).not.toHaveBeenCalled();
		expect(audit.save).not.toHaveBeenCalled();
		expect(tokens.deleteAllByUser).not.toHaveBeenCalled();
	});
});
