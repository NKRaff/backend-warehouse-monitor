import { Notification } from "@domain/entities/notification.js";
import { describe, expect, it } from "vitest";

const baseProps = () => ({
	id: "notification-1",
	alertId: "alert-1",
	recipientId: "user-1",
	channels: ["email" as const, "in_app" as const],
	createdAt: new Date("2026-03-01T08:00:00Z"),
});

describe("Notification (Entity)", () => {
	it("create() expõe os dados e nasce como não lida", () => {
		const notification = Notification.create(baseProps());

		expect(notification.id).toBe("notification-1");
		expect(notification.alertId).toBe("alert-1");
		expect(notification.recipientId).toBe("user-1");
		expect(notification.channels).toEqual(["email", "in_app"]);
		expect(notification.createdAt).toEqual(new Date("2026-03-01T08:00:00Z"));
		expect(notification.readedAt).toBeUndefined();
	});

	it("restore() preserva a data de leitura", () => {
		const readedAt = new Date("2026-03-02T09:00:00Z");

		const notification = Notification.restore({ ...baseProps(), readedAt });

		expect(notification.readedAt).toBe(readedAt);
	});
});
