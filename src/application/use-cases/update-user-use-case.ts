import type {
	UpdateUserInputDto,
	UpdateUserOutputDto,
} from "@application/dtos/update-user.dto.js";
import type { IUuidProvider } from "@application/ports/uuid-provider.interface.js";
import type { IAuditLogRepository } from "@application/repositories/audit-log.interface.js";
import type { IUserRepository } from "@application/repositories/user.interface.js";
import { AuditLog } from "@domain/entities/audit-log.js";
import { Email } from "@domain/object-values/email.js";
import { NotFoundError } from "@shared/errors/not-found-error.js";
import { UnprocessableEntityError } from "@shared/errors/unprocessable-entity-error.js";
import type { IUseCase } from "./use-case.interface.js";

export class UpdateUserUseCase
	implements IUseCase<UpdateUserInputDto, UpdateUserOutputDto>
{
	private static _instance: UpdateUserUseCase;

	private constructor(
		private readonly uuidProvider: IUuidProvider,
		private readonly userRepo: IUserRepository,
		private readonly auditLogRepo: IAuditLogRepository,
	) {}

	static instance(
		uuidProvider: IUuidProvider,
		userRepo: IUserRepository,
		auditLogRepo: IAuditLogRepository,
	): UpdateUserUseCase {
		if (!UpdateUserUseCase._instance) {
			UpdateUserUseCase._instance = new UpdateUserUseCase(
				uuidProvider,
				userRepo,
				auditLogRepo,
			);
		}
		return UpdateUserUseCase._instance;
	}

	async execute(input: UpdateUserInputDto): Promise<UpdateUserOutputDto> {
		const user = await this.userRepo.findById(input.userId);

		if (user === null) {
			throw new NotFoundError("Usuario não encontrado");
		}

		if (!input.name && !input.email) {
			throw new UnprocessableEntityError("Nenhuma alteração necessaria");
		}

		const auditLog = AuditLog.create({
			id: this.uuidProvider.generate(),
			action: "update",
			createdAt: new Date(),
			resourceId: user.id,
			resourceType: "user",
			actorId: user.id,
			metadata: {
				...(input.name && { name: { old: user.name, new: input.name } }),
				...(input.email && { email: { old: user.email, new: input.email } }),
			},
		});

		user.update({
			...(input.name && { name: input.name }),
			...(input.email && { email: new Email(input.email) }),
		});

		await this.userRepo.updateUser(user);

		await this.auditLogRepo.save(auditLog);

		return {
			message: "Usuario atualizado com sucesso",
			user: {
				id: user.id,
				email: {
					value: user.email.value,
					isVerified: user.email.isVerified,
				},
				name: user.name,
				role: user.role,
			},
		};
	}
}
