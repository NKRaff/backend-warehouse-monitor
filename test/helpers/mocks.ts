import type { IPasswordHasher } from "@application/ports/password-hasher.interface.js";
import type { ITokenProvider } from "@application/ports/token-provider.interface.js";
import type { IUuidProvider } from "@application/ports/uuid-provider.interface.js";
import type { IAlertRepository } from "@application/repositories/alert.interface.js";
import type { IAuditLogRepository } from "@application/repositories/audit-log.interface.js";
import type { INotificationRepository } from "@application/repositories/notification.interface.js";
import type { ITokenRepository } from "@application/repositories/token.interface.js";
import type { IUserRepository } from "@application/repositories/user.interface.js";
import type { IWarehouseRepository } from "@application/repositories/warehouse.interface.js";
import type { IDeviceRepository } from "@application/repositories/device.interface.js";
import type { IMqttClient } from "@application/ports/mqtt-client.interface.js";
import type { NotificationService } from "@application/services/notification.service.js";
import { vi } from "vitest";

/** Gera ids previsíveis: `uuid-1`, `uuid-2`, ... */
export function createUuidProviderMock(prefix = "uuid") {
	let counter = 0;
	return {
		generate: vi.fn<IUuidProvider["generate"]>(() => `${prefix}-${++counter}`),
	} satisfies IUuidProvider;
}

/** Hasher determinístico: `hash("x")` => `"hashed:x"`. */
export function createPasswordHasherMock() {
	return {
		hash: vi.fn<IPasswordHasher["hash"]>(async (value) => `hashed:${value}`),
		compare: vi.fn<IPasswordHasher["compare"]>(
			async (value, hash) => hash === `hashed:${value}`,
		),
	} satisfies IPasswordHasher;
}

export function createTokenProviderMock() {
	return {
		sign: vi.fn<ITokenProvider["sign"]>(
			(payload) => `token-for-${payload.sub}`,
		),
		verify: vi.fn<ITokenProvider["verify"]>((token) => ({
			sub: token.replace("token-for-", ""),
		})),
	} satisfies ITokenProvider;
}

export function createUserRepoMock() {
	return {
		save: vi.fn<IUserRepository["save"]>().mockResolvedValue(undefined),
		findById: vi.fn<IUserRepository["findById"]>().mockResolvedValue(null),
		findByEmail: vi
			.fn<IUserRepository["findByEmail"]>()
			.mockResolvedValue(null),
		findByRole: vi.fn<IUserRepository["findByRole"]>().mockResolvedValue([]),
		updatePassword: vi
			.fn<IUserRepository["updatePassword"]>()
			.mockResolvedValue(undefined),
		updateUser: vi.fn<IUserRepository["updateUser"]>().mockResolvedValue(undefined),
		updateRole: vi.fn<IUserRepository["updateRole"]>().mockResolvedValue(undefined),
		deleteById: vi.fn<IUserRepository["deleteById"]>().mockResolvedValue(undefined),
	} satisfies IUserRepository;
}

export function createAlertRepoMock() {
	return {
		save: vi.fn<IAlertRepository["save"]>().mockResolvedValue(undefined),
	} satisfies IAlertRepository;
}

export function createNotificationRepoMock() {
	return {
		save: vi.fn<INotificationRepository["save"]>().mockResolvedValue(undefined),
	} satisfies INotificationRepository;
}

export function createAuditLogRepoMock() {
	return {
		save: vi.fn<IAuditLogRepository["save"]>().mockResolvedValue(undefined),
	} satisfies IAuditLogRepository;
}

export function createTokenRepoMock() {
	return {
		save: vi.fn<ITokenRepository["save"]>().mockResolvedValue(undefined),
		findByValue: vi
			.fn<ITokenRepository["findByValue"]>()
			.mockResolvedValue(null),
		findByUserAndType: vi
			.fn<ITokenRepository["findByUserAndType"]>()
			.mockResolvedValue(null),
		updateToken: vi
			.fn<ITokenRepository["updateToken"]>()
			.mockResolvedValue(undefined),
		deleteById: vi
			.fn<ITokenRepository["deleteById"]>()
			.mockResolvedValue(undefined),
		deleteAllByUser: vi
			.fn<ITokenRepository["deleteAllByUser"]>()
			.mockResolvedValue(undefined),
	} satisfies ITokenRepository;
}

export function createWarehouseRepoMock() {
	return {
		save: vi.fn<IWarehouseRepository["save"]>().mockResolvedValue(undefined),
		findById: vi
			.fn<IWarehouseRepository["findById"]>()
			.mockResolvedValue(null),
		findByName: vi
			.fn<IWarehouseRepository["findByName"]>()
			.mockResolvedValue(null),
		findAll: vi.fn<IWarehouseRepository["findAll"]>().mockResolvedValue([]),
		updateById: vi
			.fn<IWarehouseRepository["updateById"]>()
			.mockResolvedValue(undefined),
		deletedById: vi
			.fn<IWarehouseRepository["deletedById"]>()
			.mockResolvedValue(undefined),
	} satisfies IWarehouseRepository;
}

export function createDeviceRepoMock() {
	return {
		unlinkWarehouse: vi
			.fn<IDeviceRepository["unlinkWarehouse"]>()
			.mockResolvedValue(undefined),
		save: vi.fn<IDeviceRepository["save"]>().mockResolvedValue(undefined),
		findById: vi.fn<IDeviceRepository["findById"]>().mockResolvedValue(null),
		updateById: vi
			.fn<IDeviceRepository["updateById"]>()
			.mockResolvedValue(undefined),
		deleteById: vi
			.fn<IDeviceRepository["deleteById"]>()
			.mockResolvedValue(undefined),
		findAll: vi.fn<IDeviceRepository["findAll"]>().mockResolvedValue([]),
		findAllMonitoringOn: vi
			.fn<IDeviceRepository["findAllMonitoringOn"]>()
			.mockResolvedValue([]),
	} satisfies IDeviceRepository;
}

export function createMqttClientMock() {
	return {
		publish: vi.fn<IMqttClient["publish"]>().mockResolvedValue(undefined),
		subscribe: vi.fn<IMqttClient["subscribe"]>().mockResolvedValue(undefined),
		unsubscribe: vi
			.fn<IMqttClient["unsubscribe"]>()
			.mockResolvedValue(undefined),
	} satisfies IMqttClient;
}

/**
 * `NotificationService` tem construtor privado; para os use cases basta um
 * objeto com `notify`. Devolve o `service` (para injetar) e o spy `notify`.
 */
export function createNotificationServiceMock() {
	const notify = vi
		.fn<NotificationService["notify"]>()
		.mockResolvedValue(undefined);
	return {
		notify,
		service: { notify } as unknown as NotificationService,
	};
}
