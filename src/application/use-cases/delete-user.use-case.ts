import type {
	DeleteUserInputDto,
	DeleteUserOutputDto,
} from "@application/dtos/delete-user.dto.js";
import type { IUuidProvider } from "@application/ports/uuid-provider.interface.js";
import type { IAuditLogRepository } from "@application/repositories/audit-log.interface.js";
import type { ITokenRepository } from "@application/repositories/token.interface.js";
import type { IUserRepository } from "@application/repositories/user.interface.js";
import { AuditLog } from "@domain/entities/audit-log.js";
import { NotFoundError } from "@shared/errors/not-found-error.js";
import { UnprocessableEntityError } from "@shared/errors/unprocessable-entity-error.js";
import type { IUseCase } from "./use-case.interface.js";

export class DeleteUserUseCase
	implements IUseCase<DeleteUserInputDto, DeleteUserOutputDto>
{
	private static _instance: DeleteUserUseCase;

	private constructor(
		private readonly uuidProvider: IUuidProvider,
		private readonly userRepo: IUserRepository,
		private readonly auditLogRepo: IAuditLogRepository,
		private readonly tokenRepo: ITokenRepository,
	) {}

	static instance(
		uuidProvider: IUuidProvider,
		userRepo: IUserRepository,
		auditLogRepo: IAuditLogRepository,
		tokenRepo: ITokenRepository,
	): DeleteUserUseCase {
		if (!DeleteUserUseCase._instance) {
			DeleteUserUseCase._instance = new DeleteUserUseCase(
				uuidProvider,
				userRepo,
				auditLogRepo,
				tokenRepo,
			);
		}
		return DeleteUserUseCase._instance;
	}

	async execute(input: DeleteUserInputDto): Promise<DeleteUserOutputDto> {
		const user = await this.userRepo.findById(input.userId);

		if (user === null) {
			throw new NotFoundError("Usuario não encontrado com esse id");
		}

		if (user.role === "administrator") {
			const admins = await this.userRepo.findByRole("administrator", true);
			if (admins.length === 1) {
				throw new UnprocessableEntityError(
					"O sistema precisa ter no minimo um administrator",
				);
			}
		}

		await this.userRepo.deleteById(user.id);

		const auditLog = AuditLog.create({
			id: this.uuidProvider.generate(),
			action: "delete",
			resourceId: user.id,
			resourceType: "user",
			actorId: input.actorId,
			createdAt: new Date(),
		});

		await this.auditLogRepo.save(auditLog);

		await this.tokenRepo.deleteAllByUser(user.id);

		return {
			message: "Usuario removido com sucesso",
		};
	}
}
