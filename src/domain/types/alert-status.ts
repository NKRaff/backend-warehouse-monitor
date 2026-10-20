export const AlertStatus = {
	ACTIVE: "active",
	RESOLVED: "resolved",
} as const;

export type AlertStatus = (typeof AlertStatus)[keyof typeof AlertStatus];
