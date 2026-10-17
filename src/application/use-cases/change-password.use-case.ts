import type {
	ChangePasswordInputDto,
	ChangePasswordOutputDto,
} from "@application/dtos/change-password.dto.js";
import type { IPasswordHasher } from "@application/ports/password-hasher.interface.js";
import type { IUuidProvider } from "@application/ports/uuid-provider.interface.js";
import type { IAuditLogRepository } from "@application/repositories/audit-log.interface.js";
import type { ITokenRepository } from "@application/repositories/token.interface.js";
import type { IUserRepository } from "@application/repositories/user.interface.js";
import type { PasswordPolicyService } from "@application/services/password-policy.service.js";
import { AuditLog } from "@domain/entities/audit-log.js";
import { ConflictError } from "@shared/errors/conflict-error.js";
import { NotFoundError } from "@shared/errors/not-found-error.js";
import { UnauthorizedError } from "@shared/errors/unauthorized-error.js";
import { UnprocessableEntityError } from "@shared/errors/unprocessable-entity-error.js";
import type { IUseCase } from "./use-case.interface.js";

export class ChangePasswordUseCase
	implements IUseCase<ChangePasswordInputDto, ChangePasswordOutputDto>
{
	private static _instance: ChangePasswordUseCase;

	private constructor(
		private readonly passwordHasher: IPasswordHasher,
		private readonly uuidProvider: IUuidProvider,
		private readonly userRepo: IUserRepository,
		private readonly auditLogRepo: IAuditLogRepository,
		private readonly tokenRepo: ITokenRepository,
		private readonly passwordPolicyService: PasswordPolicyService,
	) {}

	static instance(
		passwordHasher: IPasswordHasher,
		uuidProvider: IUuidProvider,
		userRepo: IUserRepository,
		auditLogRepo: IAuditLogRepository,
		tokenRepo: ITokenRepository,
		passwordPolicyService: PasswordPolicyService,
	): ChangePasswordUseCase {
		if (!ChangePasswordUseCase._instance) {
			ChangePasswordUseCase._instance = new ChangePasswordUseCase(
				passwordHasher,
				uuidProvider,
				userRepo,
				auditLogRepo,
				tokenRepo,
				passwordPolicyService,
			);
		}
		return ChangePasswordUseCase._instance;
	}

	async execute(
		input: ChangePasswordInputDto,
	): Promise<ChangePasswordOutputDto> {
		const token = await this.tokenRepo.findByValue(input.resetToken);

		if (token === null) {
			throw new NotFoundError("Reset password token não encontrado");
		}

		if (!token.verify(input.resetToken)) {
			throw new UnauthorizedError("Reset password token invalido");
		}

		if (token.isExpired()) {
			throw new UnauthorizedError("Reset password token expirou");
		}

		this.passwordPolicyService.isValid(input.password, input.confirmPassword);

		const user = await this.userRepo.findById(token.userId);

		if (!user) {
			throw new NotFoundError("Usuario não encontrado");
		}

		const isSame = await this.passwordHasher.compare(
			input.password,
			user.passwordHasher,
		);

		if (isSame) {
			throw new ConflictError("Senha não pode ser igual a senha ja cadastrada");
		}

		if (
			await this.passwordHasher.compare(input.password, user.passwordHasher)
		) {
			throw new UnprocessableEntityError(
				"A novo senha não pode ser igual a antiga",
			);
		}

		const passwordHasher = await this.passwordHasher.hash(input.password);

		await this.userRepo.updatePassword(token.userId, passwordHasher);

		await this.tokenRepo.deleteById(token.id);

		const auditLog = AuditLog.create({
			id: this.uuidProvider.generate(),
			actorId: token.userId,
			action: "change_password",
			resourceId: token.userId,
			resourceType: "user",
			createdAt: new Date(),
		});

		await this.auditLogRepo.save(auditLog);

		return {
			message: "Nova senha definida com sucesso",
		};
	}
}
