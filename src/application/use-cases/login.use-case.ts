import type {
	LoginInputDto,
	LoginOutputDto,
} from "@application/dtos/login.dto.js";
import type { IPasswordHasher } from "@application/ports/password-hasher.interface.js";
import type { ITokenProvider } from "@application/ports/token-provider.interface.js";
import type { IUuidProvider } from "@application/ports/uuid-provider.interface.js";
import type { IAuditLogRepository } from "@application/repositories/audit-log.interface.js";
import type { IUserRepository } from "@application/repositories/user.interface.js";
import { AuditLog } from "@domain/entities/audit-log.js";
import { UnprocessableEntityError } from "@shared/errors/unprocessable-entity-error.js";
import type { IUseCase } from "./use-case.interface.js";

export class LoginUseCase implements IUseCase<LoginInputDto, LoginOutputDto> {
	private static _instance: LoginUseCase;

	private constructor(
		private readonly passwordHasher: IPasswordHasher,
		private readonly tokenProvider: ITokenProvider,
		private readonly uuidProvider: IUuidProvider,
		private readonly userRepo: IUserRepository,
		private readonly auditLogRepo: IAuditLogRepository,
	) {}

	static instance(
		passwordHasher: IPasswordHasher,
		tokenProvider: ITokenProvider,
		uuidProvider: IUuidProvider,
		userRepo: IUserRepository,
		auditLogRepo: IAuditLogRepository,
	): LoginUseCase {
		if (!LoginUseCase._instance) {
			LoginUseCase._instance = new LoginUseCase(
				passwordHasher,
				tokenProvider,
				uuidProvider,
				userRepo,
				auditLogRepo,
			);
		}
		return LoginUseCase._instance;
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

		const auditLog = AuditLog.create({
			id: this.uuidProvider.generate(),
			actorId: user.id,
			action: "login",
			resourceId: user.id,
			resourceType: "user",
			createdAt: new Date(),
		});

		await this.auditLogRepo.save(auditLog);

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
			requiresPasswordChange: user.isDefaultPassword,
		};
	}
}
