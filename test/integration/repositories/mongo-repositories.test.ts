import { Alert } from "@domain/entities/alert.js";
import { AuditLog } from "@domain/entities/audit-log.js";
import { Notification } from "@domain/entities/notification.js";
import { Token } from "@domain/entities/token.js";
import { User } from "@domain/entities/user.js";
import { Email } from "@domain/object-values/email.js";
import { alertToDomain } from "@infrastructure/database/mongodb/mappers/alert.mapper.js";
import { auditLogToDomain } from "@infrastructure/database/mongodb/mappers/audit-log.mapper.js";
import { notificationToDomain } from "@infrastructure/database/mongodb/mappers/notification.mapper.js";
import { AlertModel } from "@infrastructure/database/mongodb/models/alert.model.js";
import { AuditLogModel } from "@infrastructure/database/mongodb/models/audit-log.model.js";
import { DeviceModel } from "@infrastructure/database/mongodb/models/device.model.js";
import { NotificationModel } from "@infrastructure/database/mongodb/models/notification.model.js";
import { TokenModel } from "@infrastructure/database/mongodb/models/token.model.js";
import { UserModel } from "@infrastructure/database/mongodb/models/user.model.js";
import { AlertRepository } from "@infrastructure/database/mongodb/repositories/alert.repository.js";
import { AuditLogRepository } from "@infrastructure/database/mongodb/repositories/audit-log.repository.js";
import { DeviceRepository } from "@infrastructure/database/mongodb/repositories/device.repository.js";
import { NotificationRepository } from "@infrastructure/database/mongodb/repositories/notification.repository.js";
import { TokenRepository } from "@infrastructure/database/mongodb/repositories/token.repository.js";
import { UserRepository } from "@infrastructure/database/mongodb/repositories/user.repository.js";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
	clearMongo,
	MONGO_STARTUP_TIMEOUT,
	startMongo,
	stopMongo,
} from "../../helpers/mongo.js";

beforeAll(startMongo, MONGO_STARTUP_TIMEOUT);
afterAll(stopMongo);
beforeEach(clearMongo);

describe("DeviceRepository", () => {
	const repo = DeviceRepository.instance();

	it("desvincula todos os dispositivos do armazém, marca-os offline e preserva os demais", async () => {
		await DeviceModel.create([
			{
				_id: "AA:BB:CC:DD:EE:01",
				name: "Sensor vinculado 1",
				warehouseId: "warehouse-1",
				lastMeasurementId: "measurement-1",
				deviceStatus: "online",
				monitoringStatus: "enabled",
			},
			{
				_id: "AA:BB:CC:DD:EE:02",
				name: "Sensor vinculado 2",
				warehouseId: "warehouse-1",
				lastMeasurementId: "measurement-2",
				deviceStatus: "error",
				monitoringStatus: "disabled",
			},
			{
				_id: "AA:BB:CC:DD:EE:03",
				name: "Sensor de outro armazém",
				warehouseId: "warehouse-2",
				lastMeasurementId: "measurement-3",
				deviceStatus: "online",
				monitoringStatus: "enabled",
			},
		]);

		await repo.unlinkWarehouse("warehouse-1");

		const unlinked = await DeviceModel.find({
			_id: { $in: ["AA:BB:CC:DD:EE:01", "AA:BB:CC:DD:EE:02"] },
		}).sort({ _id: 1 });
		expect(unlinked).toHaveLength(2);
		expect(unlinked.map(({ warehouseId, deviceStatus }) => ({ warehouseId, deviceStatus }))).toEqual([
			{ warehouseId: undefined, deviceStatus: "offline" },
			{ warehouseId: undefined, deviceStatus: "offline" },
		]);
		expect(unlinked[0]?.monitoringStatus).toBe("enabled");
		expect(unlinked[1]?.monitoringStatus).toBe("disabled");
		expect(await DeviceModel.findById("AA:BB:CC:DD:EE:03")).toMatchObject({
			warehouseId: "warehouse-2",
			deviceStatus: "online",
		});
	});

	it("não altera dispositivos quando o armazém não possui vínculos", async () => {
		await DeviceModel.create({
			_id: "AA:BB:CC:DD:EE:04",
			name: "Sensor independente",
			warehouseId: "warehouse-2",
			lastMeasurementId: "measurement-4",
			deviceStatus: "online",
			monitoringStatus: "enabled",
		});

		await expect(repo.unlinkWarehouse("warehouse-missing")).resolves.toBeUndefined();
		expect(await DeviceModel.findById("AA:BB:CC:DD:EE:04")).toMatchObject({
			warehouseId: "warehouse-2",
			deviceStatus: "online",
		});
	});
});

const newUser = (overrides: Partial<{ id: string; email: string }> = {}) =>
	User.create({
		id: overrides.id ?? "user-1",
		name: "Maria Silva",
		email: new Email(overrides.email ?? "maria@empresa.com"),
		passwordHashed: "hash-da-senha",
		role: "manager",
	});

describe("UserRepository + user.mapper", () => {
	const repo = UserRepository.instance();

	it("persiste e recupera o usuário com todos os campos (save + findById)", async () => {
		await repo.save(newUser());

		const found = await repo.findById("user-1");

		expect(found).not.toBeNull();
		expect(found?.id).toBe("user-1");
		expect(found?.name).toBe("Maria Silva");
		expect(found?.email.value).toBe("maria@empresa.com");
		expect(found?.email.isVerified).toBe(false);
		expect(found?.passwordHasher).toBe("hash-da-senha");
		expect(found?.role).toBe("manager");
		expect(found).not.toHaveProperty("isDefaultPassword");
		expect(found?.deletedAt).toBeUndefined();
	});

	it("preserva e-mail verificado e data de remoção (soft delete)", async () => {
		const deletedAt = new Date("2026-01-10T10:00:00.000Z");
		const email = new Email("maria@empresa.com");
		email.verify();
		await repo.save(
			User.restore({
				id: "user-1",
				name: "Maria Silva",
				email,
				passwordHashed: "hash",
				role: "operator",
				deletedAt,
			}),
		);

		const found = await repo.findById("user-1");

		expect(found?.email.isVerified).toBe(true);
		expect(found).not.toHaveProperty("isDefaultPassword");
		expect(found?.deletedAt).toEqual(deletedAt);
	});

	it("findById devolve null quando não existe", async () => {
		await expect(repo.findById("inexistente")).resolves.toBeNull();
	});

	it("findByEmail encontra pelo e-mail e devolve null quando não existe", async () => {
		await repo.save(newUser());

		const found = await repo.findByEmail("maria@empresa.com");

		expect(found?.id).toBe("user-1");
		await expect(repo.findByEmail("outra@empresa.com")).resolves.toBeNull();
	});

	it("findByRole lista apenas os usuários do papel pedido", async () => {
		const admin = (id: string, email: string) =>
			User.create({
				id,
				name: "Administrador Teste",
				email: new Email(email),
				passwordHashed: "hash",
				role: "administrator",
			});
		await repo.save(admin("admin-1", "admin1@empresa.com"));
		await repo.save(admin("admin-2", "admin2@empresa.com"));
		await repo.save(newUser({ id: "user-1", email: "gestora@empresa.com" }));

		const admins = await repo.findByRole("administrator", true);
		const operators = await repo.findByRole("operator", true);

		expect(admins.map((u) => u.id).sort()).toEqual(["admin-1", "admin-2"]);
		expect(admins.every((u) => u.role === "administrator")).toBe(true);
		expect(operators).toEqual([]);
	});

	it("rejeita dois usuários com o mesmo e-mail (índice único)", async () => {
		await repo.save(newUser({ id: "user-1" }));

		await expect(repo.save(newUser({ id: "user-2" }))).rejects.toThrow(
			/E11000|duplicate key/i,
		);
		expect(await UserModel.countDocuments()).toBe(1);
	});

	it("updatePassword troca o hash e encerra a condição de senha padrão", async () => {
		await repo.save(newUser());

		await repo.updatePassword("user-1", "novo-hash");

		const found = await repo.findById("user-1");
		expect(found?.passwordHasher).toBe("novo-hash");
		expect(found).not.toHaveProperty("isDefaultPassword");
	});

	it("updatePassword em usuário inexistente não cria nada", async () => {
		await repo.updatePassword("inexistente", "hash");

		expect(await UserModel.countDocuments()).toBe(0);
	});

	it("é um Singleton", () => {
		expect(UserRepository.instance()).toBe(repo);
	});
});

describe("AlertRepository + alert.mapper", () => {
	const repo = AlertRepository.instance();
	const alertProps = {
		id: "alert-1",
		type: "measurement_out_of_limits" as const,
		severity: "critical" as const,
		title: "Temperatura acima do limite",
		description: "Câmara fria 1 registrou 12°C",
		occurredAt: new Date("2026-03-01T08:00:00.000Z"),
	};

	it("persiste um alerta ativo e o reconstrói idêntico", async () => {
		await repo.save(Alert.create(alertProps));

		const doc = await AlertModel.findById("alert-1");
		const alert = alertToDomain(doc as NonNullable<typeof doc>);

		expect(alert.id).toBe("alert-1");
		expect(alert.type).toBe("measurement_out_of_limits");
		expect(alert.severity).toBe("critical");
		expect(alert.title).toBe(alertProps.title);
		expect(alert.description).toBe(alertProps.description);
		expect(alert.occurredAt).toEqual(alertProps.occurredAt);
		expect(alert.status).toBe("active");
		expect(alert.resolvedAt).toBeUndefined();
		expect(alert.resolvedById).toBeUndefined();
	});

	it("persiste os dados de resolução (RF-BE-029)", async () => {
		const alert = Alert.create(alertProps);
		const resolvedAt = new Date("2026-03-01T09:00:00.000Z");
		alert.resolve("user-9", resolvedAt);

		await repo.save(alert);

		const doc = await AlertModel.findById("alert-1");
		const restored = alertToDomain(doc as NonNullable<typeof doc>);
		expect(restored.status).toBe("resolved");
		expect(restored.resolvedAt).toEqual(resolvedAt);
		expect(restored.resolvedById).toBe("user-9");
	});

	it("rejeita alerta com o mesmo id", async () => {
		await repo.save(Alert.create(alertProps));

		await expect(repo.save(Alert.create(alertProps))).rejects.toThrow(
			/E11000|duplicate key/i,
		);
	});
});

describe("NotificationRepository + notification.mapper", () => {
	const repo = NotificationRepository.instance();
	const props = {
		id: "notification-1",
		alertId: "alert-1",
		recipientId: "user-1",
		channels: ["email" as const, "in_app" as const],
		createdAt: new Date("2026-03-01T08:00:00.000Z"),
	};

	it("persiste uma notificação não lida e a reconstrói", async () => {
		await repo.save(Notification.create(props));

		const doc = await NotificationModel.findById("notification-1");
		const notification = notificationToDomain(doc as NonNullable<typeof doc>);

		expect(notification.alertId).toBe("alert-1");
		expect(notification.recipientId).toBe("user-1");
		expect([...notification.channels]).toEqual(["email", "in_app"]);
		expect(notification.createdAt).toEqual(props.createdAt);
		expect(notification.readedAt).toBeUndefined();
	});

	it("persiste a data de leitura quando existe", async () => {
		const readedAt = new Date("2026-03-02T09:00:00.000Z");
		await repo.save(Notification.create({ ...props, readedAt }));

		const doc = await NotificationModel.findById("notification-1");

		expect(
			notificationToDomain(doc as NonNullable<typeof doc>).readedAt,
		).toEqual(readedAt);
	});
});

describe("AuditLogRepository + audit-log.mapper", () => {
	const repo = AuditLogRepository.instance();
	const props = {
		id: "log-1",
		actorId: "user-1",
		action: "create" as const,
		resourceId: "user-2",
		resourceType: "user" as const,
		createdAt: new Date("2026-03-01T08:00:00.000Z"),
	};

	it("persiste o registro de auditoria e o reconstrói", async () => {
		await repo.save(AuditLog.create(props));

		const doc = await AuditLogModel.findById("log-1");
		const log = auditLogToDomain(doc as NonNullable<typeof doc>);

		expect(log.actorId).toBe("user-1");
		expect(log.action).toBe("create");
		expect(log.resourceId).toBe("user-2");
		expect(log.resourceType).toBe("user");
		expect(log.createdAt).toEqual(props.createdAt);
		expect(log.metadata).toBeUndefined();
	});

	it("persiste metadados livres", async () => {
		await repo.save(
			AuditLog.create({
				...props,
				metadata: { campo: "role", de: "operator", para: "manager" },
			}),
		);

		const doc = await AuditLogModel.findById("log-1");

		expect(auditLogToDomain(doc as NonNullable<typeof doc>).metadata).toEqual({
			campo: "role",
			de: "operator",
			para: "manager",
		});
	});
});

describe("TokenRepository + token.mapper — RF-BE-005", () => {
	const repo = TokenRepository.instance();

	it("persiste somente o hash e localiza o token pelo valor recebido", async () => {
		const token = Token.createPasswordReset("reset-1", "user-1");
		const plainValue = token.value;
		token.value = token.hash();
		await repo.save(token);

		const found = await repo.findByValue(plainValue);
		const stored = await TokenModel.findById("reset-1");

		expect(found).not.toBeNull();
		expect(found?.value).toBe(token.value);
		expect(found?.verify(plainValue)).toBe(true);
		expect(stored?.valueHash).toBe(token.value);
		expect(stored?.valueHash).not.toBe(plainValue);
	});

	it("localiza token por usuário e tipo e retorna null quando ausente", async () => {
		const token = Token.createPasswordReset("reset-1", "user-1");
		token.value = token.hash();
		await repo.save(token);

		expect((await repo.findByUserAndType("user-1", "password_reset"))?.id).toBe(
			"reset-1",
		);
		await expect(
			repo.findByUserAndType("user-1", "refresh"),
		).resolves.toBeNull();
	});

	it("atualiza e invalida o token removendo-o pelo identificador", async () => {
		const token = Token.createPasswordReset("reset-1", "user-1");
		token.value = token.hash();
		await repo.save(token);
		const updatedExpiry = new Date(Date.now() + 30_000);

		await repo.updateToken("reset-1", "new-hash", updatedExpiry);
		const updated = await TokenModel.findById("reset-1");
		expect(updated?.valueHash).toBe("new-hash");
		expect(updated?.expiresAt).toEqual(updatedExpiry);

		await repo.deleteById("reset-1");
		expect(await TokenModel.findById("reset-1")).toBeNull();
	});
});
