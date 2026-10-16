import type {
	RefreshTokenInputDto,
	RefreshTokenOutputDto,
} from "@application/dtos/refresh-token.dto.js";
import type { ITokenProvider } from "@application/ports/token-provider.interface.js";
import type { ITokenRepository } from "@application/repositories/token.interface.js";
import { NotFoundError } from "@shared/errors/not-found-error.js";
import { UnauthorizedError } from "@shared/errors/unauthorized-error.js";
import type { IUseCase } from "./use-case.interface.js";

export class RefreshTokenUseCase
	implements IUseCase<RefreshTokenInputDto, RefreshTokenOutputDto>
{
	private static _instance: RefreshTokenUseCase;

	private constructor(
		private readonly tokenProvider: ITokenProvider,
		private readonly tokenRepo: ITokenRepository,
	) {}

	static instance(
		tokenProvider: ITokenProvider,
		tokenRepo: ITokenRepository,
	): RefreshTokenUseCase {
		if (!RefreshTokenUseCase._instance) {
			RefreshTokenUseCase._instance = new RefreshTokenUseCase(
				tokenProvider,
				tokenRepo,
			);
		}
		return RefreshTokenUseCase._instance;
	}

	async execute(input: RefreshTokenInputDto): Promise<RefreshTokenOutputDto> {
		const token = await this.tokenRepo.findByValue(input.refreshToken);

		if (token === null) {
			throw new NotFoundError("Refresh token não encontrado");
		}

		if (!token.verify(input.refreshToken)) {
			throw new UnauthorizedError("Refresh token invalido");
		}

		if (token.isExpired()) {
			throw new UnauthorizedError("Refresh token expirou");
		}

		token.refresh();

		const refreshToken = token.value;
		const accessToken = this.tokenProvider.sign({
			sub: token.userId,
		});

		token.value = token.hash();

		await this.tokenRepo.updateToken(token.id, token.value, token.expiresAt);

		return {
			message: "Token resetado com sucesso",
			accessToken,
			refreshToken,
		};
	}
}
