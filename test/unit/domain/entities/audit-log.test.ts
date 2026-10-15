import { AuditLog } from "@domain/entities/audit-log.js";
import { describe, expect, it } from "vitest";

const baseProps = () => ({
	id: "log-1",
	actorId: "user-1",
	action: "login" as const,
	resourceId: "user-1",
	resourceType: "user" as const,
	createdAt: new Date("2026-03-01T08:00:00Z"),
});

describe("AuditLog (Entity) — RF-BE-031", () => {
	it("create() registra quem fez o quê, em qual recurso e quando", () => {
		const log = AuditLog.create(baseProps());

		expect(log.id).toBe("log-1");
		expect(log.actorId).toBe("user-1");
		expect(log.action).toBe("login");
		expect(log.resourceId).toBe("user-1");
		expect(log.resourceType).toBe("user");
		expect(log.createdAt).toEqual(new Date("2026-03-01T08:00:00Z"));
		expect(log.metadata).toBeUndefined();
	});

	it("create() atribui 'system' como ator quando ele não é informado", () => {
		const { actorId: _omitido, ...withoutActor } = baseProps();

		const log = AuditLog.create(withoutActor);

		expect(log.actorId).toBe("system");
	});

	it("guarda metadados livres", () => {
		const log = AuditLog.create({
			...baseProps(),
			metadata: { ip: "10.0.0.1" },
		});

		expect(log.metadata).toEqual({ ip: "10.0.0.1" });
	});

	it("restore() devolve o estado persistido sem aplicar defaults", () => {
		const log = AuditLog.restore({ ...baseProps(), actorId: "user-77" });

		expect(log.actorId).toBe("user-77");
	});
});
