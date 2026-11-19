import { ChangeEmailNotificationUseCase } from "@application/use-cases/change-email-notification.dto.js";
import { NotFoundError } from "@shared/errors/not-found-error.js";
import { beforeEach, describe, expect, it } from "vitest";
import { makeUser } from "../../../helpers/factories.js";
import { createUserRepoMock } from "../../../helpers/mocks.js";
import { resetSingleton } from "../../../helpers/singleton.js";

function makeVerifiedUser() {
	const user = makeUser({ verified: true });
	user.email.changeNotification();
	return user;
}

describe("ChangeEmailNotificationUseCase — RF-BE-026", () => {
	let userRepo: ReturnType<typeof createUserRepoMock>;
	let useCase: ChangeEmailNotificationUseCase;

	beforeEach(() => {
		resetSingleton(ChangeEmailNotificationUseCase);
		userRepo = createUserRepoMock();
		useCase = ChangeEmailNotificationUseCase.instance(userRepo);
	});

	it("desativa a preferência habilitada e persiste o estado do próprio usuário", async () => {
		const user = makeVerifiedUser();
		userRepo.findById.mockResolvedValue(user);

		await expect(useCase.execute({ userId: user.id })).resolves.toEqual({
			message: "Recebimento de email Desativado",
		});
		expect(userRepo.findById).toHaveBeenCalledExactlyOnceWith(user.id);
		expect(userRepo.updateEmailNotification).toHaveBeenCalledExactlyOnceWith(
			user.id,
			false,
		);
	});

	it("ativa a preferência desativada depois da verificação do e-mail", async () => {
		const user = makeUser({ verified: true });
		userRepo.findById.mockResolvedValue(user);

		await expect(useCase.execute({ userId: user.id })).resolves.toEqual({
			message: "Recebimento de email Ativado",
		});
		expect(userRepo.updateEmailNotification).toHaveBeenCalledExactlyOnceWith(
			user.id,
			true,
		);
	});

	it("mantém desativada a preferência de endereço ainda não verificado", async () => {
		const user = makeUser();
		userRepo.findById.mockResolvedValue(user);

		await expect(useCase.execute({ userId: user.id })).resolves.toEqual({
			message: "Recebimento de email Desativado",
		});
		expect(userRepo.updateEmailNotification).toHaveBeenCalledExactlyOnceWith(
			user.id,
			false,
		);
	});

	it("retorna não encontrado sem persistir quando o usuário não existe", async () => {
		await expect(
			useCase.execute({ userId: "missing-user" }),
		).rejects.toBeInstanceOf(NotFoundError);
		expect(userRepo.updateEmailNotification).not.toHaveBeenCalled();
	});

	it("propaga falhas ao persistir a preferência", async () => {
		const user = makeVerifiedUser();
		userRepo.findById.mockResolvedValue(user);
		userRepo.updateEmailNotification.mockRejectedValue(
			new Error("Mongo indisponível"),
		);

		await expect(useCase.execute({ userId: user.id })).rejects.toThrow(
			"Mongo indisponível",
		);
	});

	it("reutiliza a instância singleton e sua primeira dependência", async () => {
		const otherRepo = createUserRepoMock();
		const other = ChangeEmailNotificationUseCase.instance(otherRepo);
		const user = makeVerifiedUser();
		userRepo.findById.mockResolvedValue(user);

		expect(other).toBe(useCase);
		await other.execute({ userId: user.id });
		expect(userRepo.findById).toHaveBeenCalledOnce();
		expect(otherRepo.findById).not.toHaveBeenCalled();
	});
});
