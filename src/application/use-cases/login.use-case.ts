import type {
	LoginInputDto,
	LoginOutputDto,
} from "@application/dtos/login.dto.js";
import type { IPasswordHasher } from "@application/ports/password-hasher.interface.js";
import type { ITokenProvider } from "@application/ports/token-provider.interface.js";
import type { IUserRepository } from "@application/repositories/user.interface.js";
import { UnprocessableEntityError } from "@shared/errors/unprocessable-entity-error.js";
import type { IUseCase } from "./use-case.interface.js";

export class Login implements IUseCase<LoginInputDto, LoginOutputDto> {
	private static _instance: Login;

	private constructor(
		private readonly passwordHasher: IPasswordHasher,
		private readonly tokenProvider: ITokenProvider,
		private readonly userRepo: IUserRepository,
	) {}

	static instance(
		passwordHasher: IPasswordHasher,
		tokenProvider: ITokenProvider,
		userRepo: IUserRepository,
	): Login {
		if (!Login._instance) {
			Login._instance = new Login(passwordHasher, tokenProvider, userRepo);
		}
		return Login._instance;
	}

	async execute(input: LoginInputDto): Promise<LoginOutputDto> {
		const user = await this.userRepo.findByEmail(input.email);

		if (user === null) {
			throw new UnprocessableEntityError("Credenciais invalidas");
		}

		const passwordIsMatch = await this.passwordHasher.compare(
			input.password,
			user.passwordHasher,
		);

		if (!passwordIsMatch) {
			throw new UnprocessableEntityError("Credenciais invalidas");
		}

		const accessToken = this.tokenProvider.sign({ sub: user.id });

		return {
			message: "Usuario autenticado com sucesso",
			user: {
				id: user.id,
				name: user.name,
				email: {
					value: user.email.value,
					isVerified: user.email.isVerified,
				},
				role: user.role,
			},
			accessToken,
		};
	}
}
