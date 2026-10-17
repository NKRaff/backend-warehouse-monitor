import type {
	ChangePasswordInputDto,
	ChangePasswordOutputDto,
} from "@application/dtos/change-password.dto.js";
import type {
	LoginInputDto,
	LoginOutputDto,
} from "@application/dtos/login.dto.js";
import type {
	RegisterUserInputDto,
	RegisterUserOutputDto,
} from "@application/dtos/register-user.dto.js";
import type { IUseCase } from "@application/use-cases/use-case.interface.js";
import { ChangePasswordController } from "@presentation/controllers/change-password.controller.js";
import { LoginController } from "@presentation/controllers/login.controller.js";
import { RegisterUserController } from "@presentation/controllers/register-user.controller.js";
import { UnauthorizedError } from "@shared/errors/unauthorized-error.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";
import { resetSingleton } from "../../helpers/singleton.js";

function useCaseStub<I, O>(output: O) {
	return {
		execute: vi.fn<IUseCase<I, O>["execute"]>().mockResolvedValue(output),
	};
}

/** Mensagens de validação devolvidas pelo Zod, indexadas pelo campo. */
async function validationMessages(promise: Promise<unknown>) {
	const error = await promise.then(
		() => undefined,
		(e: unknown) => e,
	);
	expect(error).toBeInstanceOf(ZodError);
	return Object.fromEntries(
		(error as ZodError).issues.map((issue) => [issue.path.join("."), issue.message]),
	);
}

beforeEach(() => {
	resetSingleton(
		RegisterUserController,
		LoginController,
		ChangePasswordController,
	);
});

describe("RegisterUserController", () => {
	const output: RegisterUserOutputDto = {
		message: "Usuario cadastrado com sucesso",
		user: {
			id: "user-2",
			name: "João Souza",
			email: { value: "joao@empresa.com", isVerified: false },
			role: "operator",
		},
	};
	const body = { name: "João Souza", email: "joao@empresa.com", role: "operator" };

	function setup() {
		const useCase = useCaseStub<RegisterUserInputDto, RegisterUserOutputDto>(output);
		return { useCase, controller: RegisterUserController.instance(useCase) };
	}

		it("valida o token e as senhas e delega ao use case", async () => {
		const { useCase, controller } = setup();

		const result = await controller.handle(body, { actorId: "admin-1" });

		expect(useCase.execute).toHaveBeenCalledExactlyOnceWith({
			...body,
			actorId: "admin-1",
		});
		expect(result).toBe(output);
	});

	it("ignora um actorId enviado no corpo (o ator vem sempre da sessão)", async () => {
		const { useCase, controller } = setup();

		await controller.handle({ ...body, actorId: "invasor" }, { actorId: "admin-1" });

		expect(useCase.execute).toHaveBeenCalledWith(
			expect.objectContaining({ actorId: "admin-1" }),
		);
	});

	it("rejeita (401) quando não há ator autenticado", async () => {
		const { useCase, controller } = setup();

		await expect(controller.handle(body, {})).rejects.toThrow(UnauthorizedError);

		expect(useCase.execute).not.toHaveBeenCalled();
	});

	it("rejeita corpo inválido com as mensagens de validação por campo", async () => {
		const { useCase, controller } = setup();

		const messages = await validationMessages(
			controller.handle(
				{ name: "Jo", email: "não-é-email", role: "root" },
				{ actorId: "admin-1" },
			),
		);

		expect(messages).toEqual({
			name: "Nome deve ter no minimo 4 caracteres",
			email: "Formato de email invalido",
			role: "A função escolhida não é valida",
		});
		expect(useCase.execute).not.toHaveBeenCalled();
	});

	it.each(["operator", "manager", "administrator"])(
		"aceita a função %s",
		async (role) => {
			const { controller } = setup();

			await expect(
				controller.handle({ ...body, role }, { actorId: "admin-1" }),
			).resolves.toBe(output);
		},
	);

	it("rejeita corpo ausente", async () => {
		const { controller } = setup();

		await expect(
			controller.handle(undefined, { actorId: "admin-1" }),
		).rejects.toBeInstanceOf(ZodError);
	});
});

describe("LoginController", () => {
	const output = { message: "ok", accessToken: "t" } as LoginOutputDto;

	function setup() {
		const useCase = useCaseStub<LoginInputDto, LoginOutputDto>(output);
		return { useCase, controller: LoginController.instance(useCase) };
	}

	it("valida o corpo e delega ao use case (sem exigir ator)", async () => {
		const { useCase, controller } = setup();

		const result = await controller.handle(
			{ email: "maria@empresa.com", password: "Senha@123" },
			{},
		);

		expect(useCase.execute).toHaveBeenCalledExactlyOnceWith({
			email: "maria@empresa.com",
			password: "Senha@123",
		});
		expect(result).toBe(output);
	});

	it("rejeita e-mail inválido e senha que não é string", async () => {
		const { useCase, controller } = setup();

		const messages = await validationMessages(
			controller.handle({ email: "xyz", password: 123 }, {}),
		);

		expect(messages).toEqual({
			email: "Formato de email invalido",
			password: "A senha deve ser uma string",
		});
		expect(useCase.execute).not.toHaveBeenCalled();
	});

	it("rejeita campos ausentes", async () => {
		const { controller } = setup();

		await expect(controller.handle({}, {})).rejects.toBeInstanceOf(ZodError);
	});
});

describe("ChangePasswordController", () => {
	const output: ChangePasswordOutputDto = {
		message: "Nova senha definida com sucesso",
	};

	function setup() {
		const useCase = useCaseStub<ChangePasswordInputDto, ChangePasswordOutputDto>(output);
		return { useCase, controller: ChangePasswordController.instance(useCase) };
	}

	it("valida o corpo e delega ao use case sem sessão de usuário", async () => {
		const { useCase, controller } = setup();

		const result = await controller.handle(
			{
				resetToken: "token-1",
				password: "Nova@1234",
				confirmPassword: "Nova@1234",
			},
			{},
		);

		expect(useCase.execute).toHaveBeenCalledExactlyOnceWith({
			resetToken: "token-1",
			password: "Nova@1234",
			confirmPassword: "Nova@1234",
		});
		expect(result).toBe(output);
	});

	it("rejeita corpo com campos que não são string", async () => {
		const { useCase, controller } = setup();

		const messages = await validationMessages(
			controller.handle(
				{ resetToken: 1, password: 1, confirmPassword: null },
				{},
			),
		);

		expect(messages).toEqual({
			resetToken: "O reset token deve ser uma string",
			password: "A senha deve ser uma string",
			confirmPassword: "A confirmação da senha deve ser uma string",
		});
		expect(useCase.execute).not.toHaveBeenCalled();
	});
});
