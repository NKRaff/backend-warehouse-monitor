import type {
	ChangeRoleInputDto,
	ChangeRoleOutputDto,
} from "@application/dtos/change-role-user.dto.js";
import type { IUuidProvider } from "@application/ports/uuid-provider.interface.js";
import type { IAuditLogRepository } from "@application/repositories/audit-log.interface.js";
import type { IUserRepository } from "@application/repositories/user.interface.js";
import { AuditLog } from "@domain/entities/audit-log.js";
import { NotFoundError } from "@shared/errors/not-found-error.js";
import type { IUseCase } from "./use-case.interface.js";

export class ChangeRoleUseCase
	implements IUseCase<ChangeRoleInputDto, ChangeRoleOutputDto>
{
	private static _instance: ChangeRoleUseCase;

	private constructor(
		private readonly uuidProvider: IUuidProvider,
		private readonly userRepo: IUserRepository,
		private readonly auditLogRepo: IAuditLogRepository,
	) {}

	static instance(
		uuidProvider: IUuidProvider,
		userRepo: IUserRepository,
		auditLogRepo: IAuditLogRepository,
	): ChangeRoleUseCase {
		if (!ChangeRoleUseCase._instance) {
			ChangeRoleUseCase._instance = new ChangeRoleUseCase(
				uuidProvider,
				userRepo,
				auditLogRepo,
			);
		}
		return ChangeRoleUseCase._instance;
	}

	async execute(input: ChangeRoleInputDto): Promise<ChangeRoleOutputDto> {
		const user = await this.userRepo.findById(input.userId);

		if (user === null) {
			throw new NotFoundError("Usuario não encontrado");
		}

		const auditLog = AuditLog.create({
			id: this.uuidProvider.generate(),
			action: "update",
			resourceType: "user",
			resourceId: user.id,
			actorId: input.actorId,
			createdAt: new Date(),
			metadata: {
				old: user.role,
				new: input.role,
			},
		});

		await this.userRepo.updateRole(user.id, input.role);

		await this.auditLogRepo.save(auditLog);

		return {
			message: "Função do usuario alterada com sucesso",
		};
	}
}
