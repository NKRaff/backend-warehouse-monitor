import { RefreshTokenUseCase } from "@application/use-cases/refresh-token.use-case.js";
import { Token } from "@domain/entities/token.js";
import { NotFoundError } from "@shared/errors/not-found-error.js";
import { UnauthorizedError } from "@shared/errors/unauthorized-error.js";
import { describe, expect, it } from "vitest";
import {
	createTokenProviderMock,
	createTokenRepoMock,
} from "../../../helpers/mocks.js";
import { resetSingleton } from "../../../helpers/singleton.js";

const REFRESH_TOKEN = "refresh-token-plain";

function makeStoredToken(value = REFRESH_TOKEN, expiresAt = new Date(Date.now() + 60_000)) {
	const token = Token.createRefreshToken("refresh-1", "user-1");
	token.value = value;
	const valueHash = token.hash();
	return Token.restore({
		id: token.id,
		userId: token.userId,
		type: "refresh",
		value: valueHash,
		expiresAt,
	});
}

function setup() {
	resetSingleton(RefreshTokenUseCase);
	const tokenProvider = createTokenProviderMock();
	const tokenRepo = createTokenRepoMock();
	const useCase = RefreshTokenUseCase.instance(tokenProvider, tokenRepo);
	return { useCase, tokenProvider, tokenRepo };
}

describe("RefreshTokenUseCase", () => {
	it("rejeita token ausente", async () => {
		const { useCase, tokenProvider, tokenRepo } = setup();

		await expect(
			useCase.execute({ refreshToken: REFRESH_TOKEN }),
		).rejects.toThrow(NotFoundError);
		expect(tokenProvider.sign).not.toHaveBeenCalled();
		expect(tokenRepo.updateToken).not.toHaveBeenCalled();
	});

	it("rejeita token inválido sem renová-lo", async () => {
		const { useCase, tokenProvider, tokenRepo } = setup();
		tokenRepo.findByValue.mockResolvedValue(makeStoredToken("outro-token"));

		await expect(
			useCase.execute({ refreshToken: REFRESH_TOKEN }),
		).rejects.toThrow(UnauthorizedError);
		expect(tokenProvider.sign).not.toHaveBeenCalled();
		expect(tokenRepo.updateToken).not.toHaveBeenCalled();
	});

	it("rejeita token expirado sem renová-lo", async () => {
		const { useCase, tokenProvider, tokenRepo } = setup();
		tokenRepo.findByValue.mockResolvedValue(
			makeStoredToken(REFRESH_TOKEN, new Date(Date.now() - 1)),
		);

		await expect(
			useCase.execute({ refreshToken: REFRESH_TOKEN }),
		).rejects.toThrow(/expirou/);
		expect(tokenProvider.sign).not.toHaveBeenCalled();
		expect(tokenRepo.updateToken).not.toHaveBeenCalled();
	});

	it("emite novo access token e rotaciona o refresh token", async () => {
		const { useCase, tokenProvider, tokenRepo } = setup();
		const token = makeStoredToken();
		tokenRepo.findByValue.mockResolvedValue(token);

		const result = await useCase.execute({ refreshToken: REFRESH_TOKEN });

		expect(tokenProvider.sign).toHaveBeenCalledExactlyOnceWith({ sub: "user-1" });
		expect(result.message).toBe("Token resetado com sucesso");
		expect(result.accessToken).toBe("token-for-user-1");
		expect(result.refreshToken).not.toBe(REFRESH_TOKEN);
		expect(token.verify(result.refreshToken)).toBe(true);
		expect(tokenRepo.updateToken).toHaveBeenCalledExactlyOnceWith(
			"refresh-1",
			token.value,
			token.expiresAt,
		);
	});

	it("é um Singleton", () => {
		const { useCase } = setup();
		const again = RefreshTokenUseCase.instance(
			createTokenProviderMock(),
			createTokenRepoMock(),
		);
		expect(again).toBe(useCase);
	});
});
