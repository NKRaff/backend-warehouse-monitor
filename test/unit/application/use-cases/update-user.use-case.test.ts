import { UpdateUserUseCase } from "@application/use-cases/update-user-use-case.js";
import { Email } from "@domain/object-values/email.js";
import { NotFoundError } from "@shared/errors/not-found-error.js";
import { UnprocessableEntityError } from "@shared/errors/unprocessable-entity-error.js";
import { beforeEach, describe, expect, it } from "vitest";
import { makeUser } from "../../../helpers/factories.js";
import { createAuditLogRepoMock, createUserRepoMock, createUuidProviderMock } from "../../../helpers/mocks.js";
import { resetSingleton } from "../../../helpers/singleton.js";

function setup() {
	resetSingleton(UpdateUserUseCase);
	const uuid = createUuidProviderMock();
	const users = createUserRepoMock();
	const audit = createAuditLogRepoMock();
	return { useCase: UpdateUserUseCase.instance(uuid, users, audit), users, audit };
}

describe("UpdateUserUseCase — RF-BE-009", () => {
	beforeEach(() => resetSingleton(UpdateUserUseCase));
	it("atualiza nome e e-mail e registra a auditoria", async () => {
		const { useCase, users, audit } = setup();
		const user = makeUser({ id: "user-2" });
		users.findById.mockResolvedValue(user);

		const result = await useCase.execute({ userId: user.id, name: "Carlos Souza", email: "carlos@empresa.com" });

		expect(users.updateUser).toHaveBeenCalledWith(user);
		expect(user.name).toBe("Carlos Souza");
		expect(user.email).toBeInstanceOf(Email);
		expect(user.email.value).toBe("carlos@empresa.com");
		expect(audit.save).toHaveBeenCalledWith(expect.objectContaining({ action: "update", resourceId: user.id, metadata: expect.objectContaining({ name: { old: "Maria Silva", new: "Carlos Souza" } }) }));
		expect(result.user.role).toBe("administrator");
	});
	it("rejeita usuário inexistente", async () => {
		const { useCase } = setup();
		await expect(useCase.execute({ userId: "missing", name: "Carlos" })).rejects.toThrow(NotFoundError);
	});
	it("rejeita atualização vazia", async () => {
		const { useCase, users } = setup();
		users.findById.mockResolvedValue(makeUser());
		await expect(useCase.execute({ userId: "user-1" })).rejects.toThrow(UnprocessableEntityError);
	});
});
