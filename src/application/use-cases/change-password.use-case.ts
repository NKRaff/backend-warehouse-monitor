import type {
	ChangePasswordInputDto,
	ChangePasswordOutputDto,
} from "@application/dtos/change-password.dto.js";
import type { IPasswordHasher } from "@application/ports/password-hasher.interface.js";
import type { IUuidProvider } from "@application/ports/uuid-provider.interface.js";
import type { IAuditLogRepository } from "@application/repositories/audit-log.interface.js";
import type { IUserRepository } from "@application/repositories/user.interface.js";
import type { PasswordPolicyService } from "@application/services/password-policy.service.js";
import { AuditLog } from "@domain/entities/audit-log.js";
import { ConflictError } from "@shared/errors/conflict-error.js";
import { NotFoundError } from "@shared/errors/not-found-error.js";
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
		private readonly passwordPolicyService: PasswordPolicyService,
	) {}

	static instance(
		passwordHasher: IPasswordHasher,
		uuidProvider: IUuidProvider,
		userRepo: IUserRepository,
		auditLogRepo: IAuditLogRepository,
		passwordPolicyService: PasswordPolicyService,
	): ChangePasswordUseCase {
		if (!ChangePasswordUseCase._instance) {
			ChangePasswordUseCase._instance = new ChangePasswordUseCase(
				passwordHasher,
				uuidProvider,
				userRepo,
				auditLogRepo,
				passwordPolicyService,
			);
		}
		return ChangePasswordUseCase._instance;
	}

	async execute(
		input: ChangePasswordInputDto,
	): Promise<ChangePasswordOutputDto> {
		this.passwordPolicyService.isValid(input.password, input.confirmPassword);

		const user = await this.userRepo.findById(input.actorId);

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

		const passwordHasher = await this.passwordHasher.hash(input.password);

		await this.userRepo.updatePassword(input.actorId, passwordHasher);

		const auditLog = AuditLog.create({
			id: this.uuidProvider.generate(),
			actorId: input.actorId,
			action: "change_password",
			resourceId: input.actorId,
			resourceType: "user",
			createdAt: new Date(),
		});

		await this.auditLogRepo.save(auditLog);

		return {
			message: "Nova senha definida com sucesso",
		};
	}
}
